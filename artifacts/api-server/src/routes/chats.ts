import { Router, type IRouter } from "express";
import { and, eq, or, sql } from "drizzle-orm";
import { db, chatsTable, peopleTable } from "@workspace/db";
import { RequestChatBody, UpdateChatBody, UpdateChatParams, DownloadCalendarParams, GetChatsResponse, RequestChatResponse, UpdateChatResponse } from "@workspace/api-zod";
import { requireUser } from "../middlewares/session";
import { assertContact, HttpError, id, nowFor, personRow, publicPerson } from "../lib/domain";
import { chatView, ownChat, userChats } from "../lib/network";
import { careerAi } from "../lib/ai";

const router: IRouter = Router();
router.use("/chats", requireUser);
router.get("/chats", async (req, res) => { res.json(GetChatsResponse.parse(await userChats(req.cpUser!.id))); });
router.post("/chats", async (req, res) => {
  const body = RequestChatBody.parse(req.body);
  const user = req.cpUser!;
  if (user.role !== "student") throw new HttpError(403, "Only students can request alumni coffee chats.");
  const alumniRow = await personRow(body.alumniId);
  const alumni = publicPerson(alumniRow);
  if (alumni.role !== "alumni" || !alumni.openToChat || alumni.paused || !alumni.maxChats) throw new HttpError(400, "This alum isn't taking coffee chats right now.");
  await assertContact(user.id, alumni.id);
  const times = [...new Set(body.times)];
  if (!times.length || times.some(t => !alumni.availability?.includes(t) || !Number.isFinite(Date.parse(t)) || new Date(t) <= nowFor(user))) throw new HttpError(400, "Choose up to three future times from this alum's availability.");
  const existing = await db.select().from(chatsTable).where(and(eq(chatsTable.studentId, user.id), eq(chatsTable.alumniId, alumni.id)));
  if (existing.some(c => ["pending", "suggested", "accepted"].includes(c.status) && (!c.scheduledAt || new Date(c.scheduledAt) > nowFor(user)))) throw new HttpError(409, "You already have an active coffee-chat request with this alum.");
  const [chat] = await db.insert(chatsTable).values({
    id: id(), studentId: user.id, alumniId: alumni.id, duration: body.duration,
    format: body.format, times, note: body.note.slice(0, 2000),
  }).returning();
  res.json(RequestChatResponse.parse(await chatView(chat!, user.id)));
});
router.patch("/chats/:id", async (req, res) => {
  const { id } = UpdateChatParams.parse(req.params);
  const body = UpdateChatBody.parse(req.body);
  const user = req.cpUser!;
  const chat = await ownChat(user.id, id);
  await assertContact(chat.studentId, chat.alumniId);
  let patch: Partial<typeof chatsTable.$inferInsert> = {};
  switch (body.action) {
    case "accept": {
      const isAlum = user.id === chat.alumniId;
      if (isAlum ? chat.status !== "pending" : chat.status !== "suggested") throw new HttpError(403, "This request cannot be accepted by you in its current state.");
      const at = body.scheduledAt || chat.times[0];
      if (!at || !chat.times.includes(at) || new Date(at) <= nowFor(user)) throw new HttpError(400, "Choose a future time offered in this request.");
      const accepted = await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${chat.alumniId}))`);
        const [current] = await tx.select().from(chatsTable).where(eq(chatsTable.id, id));
        if (!current || current.status !== chat.status) throw new HttpError(409, "This request changed. Please refresh.");
        const alumni = publicPerson(await personRow(chat.alumniId));
        if (alumni.paused || !alumni.openToChat) throw new HttpError(409, "This alum has paused coffee chats.");
        const all = await tx.select().from(chatsTable).where(or(eq(chatsTable.alumniId, chat.alumniId), eq(chatsTable.studentId, chat.studentId)));
        const month = at.slice(0, 7);
        const count = all.filter(c => c.id !== id && c.alumniId === chat.alumniId && ["accepted", "completed"].includes(c.status) && c.scheduledAt.slice(0, 7) === month).length;
        if (count >= (alumni.maxChats ?? 4)) throw new HttpError(409, "This alum has reached their coffee-chat limit for that month.");
        const start = Date.parse(at), end = start + chat.duration * 60000;
        if (all.some(c => c.id !== id && c.status === "accepted" && Date.parse(c.scheduledAt) < end && Date.parse(c.scheduledAt) + c.duration * 60000 > start)) throw new HttpError(409, "This time conflicts with an existing chat. Suggest a different time.");
        const [updated] = await tx.update(chatsTable).set({ status: "accepted", scheduledAt: at }).where(eq(chatsTable.id, id)).returning();
        return updated!;
      });
      res.json(UpdateChatResponse.parse(await chatView(accepted, user.id)));
      return;
    }
    case "suggest":
      if (user.id !== chat.alumniId || !["pending", "suggested"].includes(chat.status)) throw new HttpError(403, "Only the alum can suggest a new time for an open request.");
      if (!body.scheduledAt || !Number.isFinite(Date.parse(body.scheduledAt)) || new Date(body.scheduledAt) <= nowFor(user)) throw new HttpError(400, "Suggest a valid future date and time.");
      patch = { status: "suggested", times: [body.scheduledAt], scheduledAt: body.scheduledAt, note: body.note?.slice(0, 2000) || chat.note };
      break;
    case "decline":
      if (user.id !== chat.alumniId || !["pending", "suggested"].includes(chat.status)) throw new HttpError(403, "Only the alum can decline an open request.");
      patch = { status: "declined", note: body.note?.slice(0, 2000) || "Thank you for reaching out. I'm unable to meet at the moment, but wish you the best with your next steps." };
      break;
    case "notes": {
      if (user.id !== chat.studentId || !["accepted", "completed"].includes(chat.status) || !chat.scheduledAt || new Date(Date.parse(chat.scheduledAt) + chat.duration * 60000) > nowFor(user)) throw new HttpError(403, "Add notes after your coffee chat has finished.");
      const notes = (body.notes || "").trim().slice(0, 10000);
      if (!notes) throw new HttpError(400, "Add a few notes from your conversation first.");
      const result = await careerAi("notes", { student: publicPerson(user), alumni: publicPerson(await personRow(chat.alumniId)), notes }, notes);
      patch = { notes, summary: result.text, actionItems: result.actions, status: "completed" };
      await db.update(peopleTable).set({ extraActions: [...new Set([...user.extraActions, ...result.actions])] }).where(eq(peopleTable.id, user.id));
      break;
    }
    default: throw new HttpError(400, "Choose a coffee-chat action.");
  }
  const [updated] = await db.update(chatsTable).set(patch).where(eq(chatsTable.id, id)).returning();
  res.json(UpdateChatResponse.parse(await chatView(updated!, user.id)));
});
router.get("/chats/:id/calendar", async (req, res) => {
  const { id } = DownloadCalendarParams.parse(req.params);
  const chat = await ownChat(req.cpUser!.id, id);
  if (!["accepted", "completed"].includes(chat.status) || !Number.isFinite(Date.parse(chat.scheduledAt))) throw new HttpError(400, "Accept a time before adding this chat to your calendar.");
  const person = publicPerson(await personRow(req.cpUser!.id === chat.studentId ? chat.alumniId : chat.studentId));
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CareerPath//USC Coffee Chats//EN", "BEGIN:VEVENT",
    `UID:${id}@careerpath.demo`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(new Date(chat.scheduledAt))}`, `DTEND:${stamp(new Date(Date.parse(chat.scheduledAt) + chat.duration * 60000))}`,
    `SUMMARY:${escape(`CareerPath coffee chat with ${person.name}`)}`,
    `DESCRIPTION:${escape("Connect in CareerPath Messages to confirm meeting details. " + chat.note)}`,
    `LOCATION:${escape(chat.format === "campus" ? "USC campus — confirm location in Messages" : "Virtual — confirm link in Messages")}`, "END:VEVENT", "END:VCALENDAR"];
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="careerpath-coffee-chat.ics"');
  res.send(lines.join("\r\n") + "\r\n");
});
export default router;
