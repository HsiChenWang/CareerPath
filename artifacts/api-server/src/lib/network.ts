import { and, asc, eq, or, sql } from "drizzle-orm";
import { db, peopleTable, conversationsTable, messagesTable, chatsTable, followupsTable, type PersonRow, type ChatRow, type FollowupRow } from "@workspace/db";
import { batchProcess } from "@workspace/integrations-openai-ai-server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { type Network } from "@workspace/api-zod";
import { assertContact, conversationMessages, conversationView, ensureConversation, HttpError, id, nowFor, otherId, personRow, publicPerson, isBlocked } from "./domain";
import { careerAi, aiJson } from "./ai";
import { gapFor } from "./careers";

export async function chatView(chat: ChatRow, userId: string) {
  return { ...chat, person: publicPerson(await personRow(chat.studentId === userId ? chat.alumniId : chat.studentId)), createdAt: chat.createdAt.toISOString() };
}
export async function ownChat(userId: string, chatId: string) {
  const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, chatId));
  if (!chat || (chat.studentId !== userId && chat.alumniId !== userId)) throw new HttpError(404, "Coffee chat not found.");
  return chat;
}
export async function userChats(userId: string) {
  const chats = await db.select().from(chatsTable).where(or(eq(chatsTable.studentId, userId), eq(chatsTable.alumniId, userId)));
  return Promise.all(chats.map(c => chatView(c, userId)));
}
export async function postMessage(user: PersonRow, conversationId: string, text: string, nudge = false) {
  const conv = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId)).then(x => x[0]);
  if (!conv || (conv.firstId !== user.id && conv.secondId !== user.id)) throw new HttpError(404, "Conversation not found.");
  const recipient = await personRow(otherId(conv, user.id));
  await assertContact(user.id, recipient.id);
  return db.transaction(async tx => {
    // Serialize a student's outbound writes across all conversations, including first-contact quota.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id}))`);
    const prior = await tx.select().from(messagesTable).where(eq(messagesTable.conversationId, conv.id)).orderBy(asc(messagesTable.createdAt));
    const hasReply = prior.some(m => m.senderId === recipient.id);
    const sent = prior.some(m => m.senderId === user.id);
    if (user.role === "student" && recipient.role === "alumni") {
      if (sent && !hasReply && !nudge) throw new HttpError(429, "Wait for this alum to reply before sending another message. CareerPath will offer one polite nudge after 7 days.");
      if (!sent) {
        const firstContacts = await tx.execute(sql`
          SELECT count(*)::int as count FROM (
            SELECT m.conversation_id, min(m.created_at) AS first_at
            FROM cp_messages m JOIN cp_conversations c ON c.id = m.conversation_id
            JOIN cp_people p ON p.id = CASE WHEN c.first_id = ${user.id} THEN c.second_id ELSE c.first_id END
            WHERE m.sender_id = ${user.id} AND p.role = 'alumni'
            GROUP BY m.conversation_id
          ) contacts WHERE first_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
        `);
        if (Number(firstContacts.rows[0]?.count ?? 0) >= 5) throw new HttpError(429, "You've reached today's limit of 5 new alumni introductions. Continue existing conversations or try again tomorrow.");
      }
    }
    const [message] = await tx.insert(messagesTable).values({ id: id(), conversationId, senderId: user.id, text: text.trim(), kind: nudge ? "nudge" : "message" }).returning();
    return { ...message!, createdAt: message!.createdAt.toISOString() };
  });
}
async function addTask(user: PersonRow, personId: string, source: string, kind: string, reason: string, dueAt: Date) {
  await db.insert(followupsTable).values({ id: id(), userId: user.id, personId, source, kind, reason, dueAt }).onConflictDoNothing();
}
export async function discoverFollowups(user: PersonRow) {
  if (user.role !== "student") return;
  const now = nowFor(user);
  const chats = await db.select().from(chatsTable).where(eq(chatsTable.studentId, user.id));
  for (const chat of chats) {
    if (!chat.scheduledAt || !["accepted", "completed"].includes(chat.status)) continue;
    const end = new Date(new Date(chat.scheduledAt).getTime() + chat.duration * 60000);
    if (end > now || await isBlocked(user.id, chat.alumniId)) continue;
    await addTask(user, chat.alumniId, `thankyou-${chat.id}`, "thank-you", "Send a thank-you within 24 hours of your coffee chat.", end);
    await addTask(user, chat.alumniId, `checkin-${chat.id}`, "check-in", "It's been four weeks since your chat. Share what you've acted on.", new Date(end.getTime() + 28 * 86400000));
  }
  const conversations = await db.select().from(conversationsTable).where(or(eq(conversationsTable.firstId, user.id), eq(conversationsTable.secondId, user.id)));
  for (const conv of conversations) {
    const recipient = await personRow(otherId(conv, user.id));
    if (recipient.role !== "alumni" || await isBlocked(user.id, recipient.id)) continue;
    const messages = await conversationMessages(conv.id);
    if (!messages.length || messages.some(m => m.senderId === recipient.id)) continue;
    const sent = messages.find(m => m.senderId === user.id);
    if (sent) await addTask(user, recipient.id, `nudge-${recipient.id}`, "no-reply nudge", "No reply after 7 days. One polite nudge is allowed.", new Date(sent.createdAt.getTime() + 7 * 86400000));
  }
}
export async function milestoneFollowups(user: PersonRow, milestone: string, stepId: string) {
  const chats = await db.select().from(chatsTable).where(and(eq(chatsTable.studentId, user.id), eq(chatsTable.status, "completed")));
  const unique = [...new Set(chats.filter(c => {
    const notes = `${c.notes} ${c.summary} ${c.actionItems.join(" ")}`.toLowerCase();
    return milestone.toLowerCase().split(/\W+/).filter(x => x.length > 4).some(x => notes.includes(x));
  }).map(c => c.alumniId))];
  for (const recipient of unique) {
    if (await isBlocked(user.id, recipient)) continue;
    await addTask(user, recipient, `milestone-${stepId}-${recipient}`, "milestone update", `You completed "${milestone}" — update the Trojan whose advice helped.`, nowFor(user));
  }
}
export async function recordMilestone(user: PersonRow, title: string) {
  const conversations = await db.select().from(conversationsTable).where(or(eq(conversationsTable.firstId, user.id), eq(conversationsTable.secondId, user.id)));
  const chats = await db.select().from(chatsTable).where(eq(chatsTable.studentId, user.id));
  const candidates = [];
  for (const personId of new Set([...chats.map(c => c.alumniId), ...conversations.map(c => otherId(c, user.id))])) {
    const person = publicPerson(await personRow(personId));
    if (person.role !== "alumni" || await isBlocked(user.id, personId)) continue;
    const conv = conversations.find(c => otherId(c, user.id) === personId);
    const msgs = conv ? await conversationMessages(conv.id) : [];
    const meetings = chats.filter(c => c.alumniId === personId && c.status === "completed");
    if (!msgs.some(m => m.senderId === personId) && !meetings.length) continue;
    candidates.push({ person, advice: meetings.map(c => c.summary), conversations: msgs.map(m => m.text) });
  }
  const fallback = { people: candidates.slice(0, 2).map(c => ({ id: c.person.id, reason: "You've previously had a conversation about your career." })) };
  const schema = z.object({ people: z.array(z.object({ id: z.string(), reason: z.string() })).max(3) });
  const result = candidates.length ? await aiJson("Pick up to 3 alumni from the candidates who would be most relevant to this real student milestone. Prefer those who gave advice the milestone acted on or work in that field. Only choose supplied IDs. JSON {people:[{id,reason}]}. Return [] if nobody is relevant.", { milestone: title, candidates }, x => schema.parse(x), fallback) : { value: fallback };
  const key = createHash("sha256").update(title.toLowerCase()).digest("hex").slice(0, 16);
  const extra = [...new Set([...user.extraActions, title])];
  const index = extra.indexOf(title);
  const [saved] = await db.update(peopleTable).set({ extraActions: extra, completed: { ...user.completed, [`advice-${index}`]: true } }).where(eq(peopleTable.id, user.id)).returning();
  for (const chosen of result.value.people) {
    if (!candidates.some(c => c.person.id === chosen.id)) continue;
    await addTask(user, chosen.id, `milestone-${key}-${chosen.id}`, "milestone update", `You completed "${title}". ${chosen.reason}`, nowFor(user));
  }
  return networkFor(saved!);
}
async function followupDraft(task: FollowupRow, user: PersonRow) {
  const person = publicPerson(await personRow(task.personId));
  const chats = await db.select().from(chatsTable).where(and(eq(chatsTable.studentId, user.id), eq(chatsTable.alumniId, task.personId)));
  const completed = gapFor(user).steps.filter(s => s.done).map(s => s.title);
  const specificAdvice = chats.flatMap(x => x.actionItems).slice(0, 1).join("");
  const fallback = task.kind === "no-reply nudge"
    ? `Hi ${person.name.split(" ")[0]}, just following up once on my note. If you have time for one piece of advice about your path to ${person.company}, I'd appreciate it. No worries if now isn't a good time. — ${user.name}`
    : `Hi ${person.name.split(" ")[0]}, thank you for taking the time to chat.${specificAdvice ? ` Your advice to ${specificAdvice.charAt(0).toLowerCase() + specificAdvice.slice(1)} was helpful.` : ""}${task.kind === "check-in" && completed.length ? ` Since then, I've completed: ${completed.slice(0, 2).join("; ")}.` : ""} I appreciate your guidance. — ${user.name}`;
  const result = await careerAi("followup", { student: publicPerson(user), person, kind: task.kind, reason: task.reason, chats, completed }, fallback);
  return result.text;
}
const networkCache = new Map<string, { key: string; at: number; summary: string }>();
export async function networkFor(user: PersonRow): Promise<Network> {
  await discoverFollowups(user);
  const now = nowFor(user);
  const tasks = await db.select().from(followupsTable).where(and(eq(followupsTable.userId, user.id), eq(followupsTable.status, "pending"))).orderBy(asc(followupsTable.dueAt));
  const due: FollowupRow[] = [];
  for (const t of tasks) {
    if (t.dueAt > now || await isBlocked(user.id, t.personId)) continue;
    if (t.kind === "no-reply nudge") {
      const conv = await ensureConversation(user.id, t.personId);
      const msgs = await conversationMessages(conv.id);
      if (msgs.some(m => m.senderId === t.personId)) {
        await db.update(followupsTable).set({ status: "skip" }).where(eq(followupsTable.id, t.id));
        continue;
      }
    }
    due.push(t);
  }
  await batchProcess(due.filter(t => !t.draft), async t => {
    t.draft = await followupDraft(t, user);
    await db.update(followupsTable).set({ draft: t.draft }).where(eq(followupsTable.id, t.id));
  }, { concurrency: 2, retries: 1 });
  const conversations = await db.select().from(conversationsTable).where(or(eq(conversationsTable.firstId, user.id), eq(conversationsTable.secondId, user.id)));
  const chats = await userChats(user.id);
  const connections: Network["connections"] = [];
  for (const conv of conversations) {
    const view = await conversationView(conv, user);
    if (view.blocked || !view.lastMessage) continue;
    const meetings = chats.filter(c => c.person.id === view.person.id);
    const status = due.some(t => t.personId === view.person.id) ? "Follow-up due" : meetings.some(c => c.status === "completed") ? "Chat done" : meetings.some(c => c.status === "accepted") ? "Chat scheduled" : view.hasReply ? "Replied" : "Messaged";
    connections.push({ person: view.person, status, lastContact: view.updatedAt });
  }
  for (const chat of chats) {
    if (connections.some(c => c.person.id === chat.person.id) || await isBlocked(user.id, chat.person.id)) continue;
    connections.push({ person: chat.person, status: chat.status === "completed" ? "Chat done" : chat.status === "accepted" ? "Chat scheduled" : "Messaged", lastContact: chat.createdAt });
  }
  const upcoming = chats.filter(c => c.status === "accepted" && new Date(c.scheduledAt) >= now);
  const waiting = connections.filter(c => c.status === "Messaged").length;
  const relationships = new Set(chats.filter(c => c.status === "completed").map(c => c.person.id)).size;
  const baseline = `You have ${due.length} follow-up${due.length === 1 ? "" : "s"} due and ${upcoming.length} upcoming coffee chat${upcoming.length === 1 ? "" : "s"}. ${user.extraActions.length ? `Keep acting on the advice from your chats — ${user.extraActions[0]}.` : "Start with one thoughtful conversation this week."}`;
  const key = JSON.stringify([connections.map(c => [c.person.id, c.status]), due.map(t => t.id), upcoming.map(c => c.scheduledAt), user.completed]);
  const cache = networkCache.get(user.id);
  let summary = cache && cache.key === key && Date.now() - cache.at < 600000 ? cache.summary : "";
  if (!summary) {
    const result = await careerAi("weekly", { user: publicPerson(user), now: now.toISOString(), due: due.map(t => ({ kind: t.kind, reason: t.reason })), upcoming, waiting, relationships, gap: gapFor(user) }, baseline);
    summary = result.text;
    networkCache.set(user.id, { key, at: Date.now(), summary });
  }
  return {
    summary, connections, chats, followups: await Promise.all(due.map(async t => ({ ...t, person: publicPerson(await personRow(t.personId)), dueAt: t.dueAt.toISOString() }))),
    waiting, relationships, now: now.toISOString(), offsetDays: user.offsetDays,
  };
}
