import { randomUUID } from "node:crypto";
import { and, eq, or, asc } from "drizzle-orm";
import { db, peopleTable, safetyTable, conversationsTable, messagesTable, type PersonRow, type ConversationRow } from "@workspace/db";
import { GetPersonResponse, type Person } from "@workspace/api-zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const id = () => randomUUID();
export const nowFor = (user: PersonRow) => new Date(Date.now() + user.offsetDays * 86400000);
export const publicPerson = (row: PersonRow): Person => {
  const profile = row.profile as Record<string, unknown>;
  const alumniNumber = row.id === "priya"
    ? 1
    : Number(row.id.match(/^alum-(\d+)$/)?.[1] ?? 0);
  const portraitNumber = alumniNumber > 0 ? ((alumniNumber - 1) % 12) + 1 : 0;
  const studentNumber = Number(row.id.match(/^student-(\d+)$/)?.[1] ?? 0);
  const peerPortraitNumber = studentNumber >= 2 ? ((studentNumber - 2) % 12) + 1 : 0;
  const demoPortrait = row.isDemo && row.role === "alumni" && portraitNumber
    ? `avatars/alumni-${String(portraitNumber).padStart(2, "0")}.jpg`
    : row.isDemo && row.role === "student" && row.id === "alex"
      ? "avatars/student-alex.jpg"
      : row.isDemo && row.role === "student" && peerPortraitNumber
        ? `avatars/alumni-${String(peerPortraitNumber).padStart(2, "0")}.jpg`
      : undefined;
  return GetPersonResponse.parse({
    clubs: [], skills: [], interests: [], experience: [], courses: [], timeline: [],
    ...profile,
    ...(typeof profile.photo === "string" ? {} : demoPortrait ? { photo: demoPortrait } : {}),
    id: row.id, name: row.name, role: row.role, isDemo: row.isDemo,
  });
};
function stableContactHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export function publicPersonWithDemoContacts(row: PersonRow): Person {
  const person = publicPerson(row);
  const profile = row.profile as Record<string, unknown>;
  const hasSavedContact = ["linkedin", "contactEmail", "phone"].some(key => profile[key] !== undefined && profile[key] !== null);
  if (!row.isDemo || hasSavedContact) return person;

  // Stable pseudo-random assignment keeps demo contact examples from changing on refresh.
  const hash = stableContactHash(`${row.role}:${row.id}`);
  if (hash % 4 !== 0 && hash % 4 !== 3) return person;
  const slug = `${row.name}-${row.id}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const sampleEmail = `${slug}@example.com`;
  const sampleLinkedIn = `https://www.linkedin.com/in/demo-${slug}`;
  const samplePhone = `+1 (202) 555-01${String(hash % 100).padStart(2, "0")}`;
  const contacts = (() => {
    switch ((hash >>> 2) % 4) {
      case 0: return { contactEmail: sampleEmail };
      case 1: return { linkedin: sampleLinkedIn };
      case 2: return { phone: samplePhone };
      default: return { contactEmail: sampleEmail, phone: samplePhone };
    }
  })();
  return GetPersonResponse.parse({ ...person, ...contacts });
}
export async function personRow(personId: string) {
  const [person] = await db.select().from(peopleTable).where(eq(peopleTable.id, personId));
  if (!person) throw new HttpError(404, "This Trojan could not be found.");
  return person;
}
export async function isBlocked(a: string, b: string) {
  const blocks = await db.select().from(safetyTable).where(and(eq(safetyTable.action, "block"), or(
    and(eq(safetyTable.userId, a), eq(safetyTable.personId, b)),
    and(eq(safetyTable.userId, b), eq(safetyTable.personId, a)),
  )));
  return blocks.length > 0;
}
export async function assertContact(a: string, b: string) {
  if (a === b) throw new HttpError(400, "Choose another Trojan.");
  if (await isBlocked(a, b)) throw new HttpError(403, "Contact is unavailable because this connection is blocked.");
}
export async function ensureConversation(userId: string, personId: string) {
  await personRow(personId);
  await assertContact(userId, personId);
  const pair = [userId, personId].sort().join(":");
  const [created] = await db.insert(conversationsTable).values({
    id: id(), pair, firstId: userId, secondId: personId,
  }).onConflictDoNothing().returning();
  if (created) return created;
  const [existing] = await db.select().from(conversationsTable).where(eq(conversationsTable.pair, pair));
  return existing!;
}
export async function ownConversation(userId: string, conversationId: string) {
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conv || (conv.firstId !== userId && conv.secondId !== userId)) throw new HttpError(404, "Conversation not found.");
  return conv;
}
export const otherId = (conv: ConversationRow, userId: string) => conv.firstId === userId ? conv.secondId : conv.firstId;
export async function conversationMessages(convId: string) {
  return db.select().from(messagesTable).where(eq(messagesTable.conversationId, convId)).orderBy(asc(messagesTable.createdAt), asc(messagesTable.id));
}
export async function conversationView(conv: ConversationRow, user: PersonRow) {
  const other = await personRow(otherId(conv, user.id));
  const messages = await conversationMessages(conv.id);
  const hasReply = messages.some(m => m.senderId === other.id);
  const sent = messages.some(m => m.senderId === user.id);
  const blocked = await isBlocked(user.id, other.id);
  return {
    id: conv.id, person: publicPerson(other),
    lastMessage: messages.at(-1)?.text ?? "",
    updatedAt: (messages.at(-1)?.createdAt ?? conv.createdAt).toISOString(),
    hasReply, blocked,
    canSend: !blocked && !(user.role === "student" && other.role === "alumni" && sent && !hasReply),
  };
}
export function similarity(user: Person, other: Person) {
  const sharedClubs = user.clubs.filter(x => other.clubs.includes(x));
  const sharedSkills = user.skills.filter(x => other.skills.includes(x));
  const sharedInterests = user.interests.filter(x => other.interests.some(y => y.toLowerCase() === x.toLowerCase()));
  const sharedCourses = user.courses.filter(x => other.courses.includes(x));
  const sameMajor = user.major === other.major;
  const sameSchool = user.school === other.school;
  const goalRole = user.dreamRole && `${other.currentRole} ${other.dreamRole}`.toLowerCase().includes(user.dreamRole.toLowerCase());
  const goalCompany = user.dreamCompany && `${other.company} ${other.dreamCompany}`.toLowerCase().includes(user.dreamCompany.toLowerCase());
  const score = 35 + (goalRole ? 25 : 0) + (goalCompany ? 20 : 0) + (sameMajor ? 15 : 0) + (sameSchool ? 8 : 0) + sharedClubs.length * 8 + sharedSkills.length * 3 + sharedCourses.length * 2 + sharedInterests.length * 2;
  const details = [
    sharedClubs.length ? `You both ${other.role === "alumni" ? "started in" : "belong to"} ${sharedClubs.join(" and ")}` : "",
    sameMajor ? `a shared ${user.major} background` : (sameSchool ? `both from ${user.school}` : ""),
    sharedSkills.length ? `${sharedSkills.slice(0, 2).join(" and ")} skills` : "",
    sharedInterests.length ? `an interest in ${sharedInterests[0]}` : "",
  ].filter(Boolean);
  return {
    score: Math.min(99, score),
    reason: details.length ? `${details.join("; ")}. ${other.role === "alumni" ? `See how that led to ${other.currentRole} at ${other.company}.` : `Compare goals and practice for ${other.dreamRole || "internship"} interviews together.`}` : `Explore a different route from ${other.school} into ${other.currentRole || other.dreamRole}. Ask what helped them make the transition.`,
  };
}
