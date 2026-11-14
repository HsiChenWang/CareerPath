import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, followupsTable, peopleTable } from "@workspace/db";
import { GetNetworkResponse, UpdateFollowupParams, UpdateFollowupBody, UpdateFollowupResponse, RecordMilestoneBody } from "@workspace/api-zod";
import { requireUser } from "../middlewares/session";
import { ensureConversation, HttpError, nowFor, personRow, publicPerson, conversationMessages } from "../lib/domain";
import { networkFor, postMessage, recordMilestone } from "../lib/network";

const router: IRouter = Router();
router.use(["/network", "/followups"], requireUser);
router.get("/network", async (req, res) => { res.json(GetNetworkResponse.parse(await networkFor(req.cpUser!))); });
router.post("/network/milestones", async (req, res) => {
  const { title } = RecordMilestoneBody.parse(req.body);
  if (req.cpUser!.role !== "student") throw new HttpError(403, "Milestones are for student career plans.");
  if (title.trim().length < 3) throw new HttpError(400, "Describe your milestone.");
  res.json(GetNetworkResponse.parse(await recordMilestone(req.cpUser!, title.trim())));
});
router.post("/network/advance", async (req, res) => {
  const user = req.cpUser!;
  if (!user.isDemo || user.role !== "student") throw new HttpError(403, "Fast-forward is available only in the student demo.");
  if (user.offsetDays >= 365) throw new HttpError(400, "The demo clock is already one year ahead.");
  const [advanced] = await db.update(peopleTable).set({ offsetDays: user.offsetDays + 7 }).where(eq(peopleTable.id, user.id)).returning();
  res.json(GetNetworkResponse.parse(await networkFor(advanced!)));
});
router.patch("/followups/:id", async (req, res) => {
  const { id } = UpdateFollowupParams.parse(req.params);
  const body = UpdateFollowupBody.parse(req.body);
  const user = req.cpUser!;
  const updated = await db.transaction(async tx => {
    // A row lock makes a double-click or second browser's Send safe.
    await tx.execute(sql`select id from cp_followups where id = ${id} for update`);
    const [task] = await tx.select().from(followupsTable).where(and(eq(followupsTable.id, id), eq(followupsTable.userId, user.id)));
    if (!task) throw new HttpError(404, "Follow-up not found.");
    if (task.status !== "pending") throw new HttpError(409, "This follow-up has already been handled.");
    const draft = (body.draft ?? task.draft).trim().slice(0, 5000);
    let patch: Partial<typeof followupsTable.$inferInsert> = { draft };
    switch (body.action) {
      case "send": {
        if (task.dueAt > nowFor(user)) throw new HttpError(400, "This follow-up is snoozed or not due yet.");
        if (!draft) throw new HttpError(400, "Write or generate a follow-up before sending.");
        const conv = await ensureConversation(user.id, task.personId);
        if (task.kind === "no-reply nudge") {
          const messages = await conversationMessages(conv.id);
          if (messages.some(m => m.senderId === task.personId || m.kind === "nudge")) throw new HttpError(409, "A nudge is no longer appropriate: this alum has replied or already received one.");
        }
        await postMessage(user, conv.id, draft, task.kind === "no-reply nudge");
        patch.status = "sent";
        break;
      }
      case "edit": break;
      case "snooze": patch.dueAt = new Date(nowFor(user).getTime() + 3 * 86400000); break;
      case "skip": patch.status = "skipped"; break;
    }
    const [result] = await tx.update(followupsTable).set(patch).where(eq(followupsTable.id, id)).returning();
    return result!;
  });
  res.json(UpdateFollowupResponse.parse({ ...updated, person: publicPerson(await personRow(updated.personId)), dueAt: updated.dueAt.toISOString() }));
});
export default router;
