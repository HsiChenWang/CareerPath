import { Router, type IRouter } from "express";
import { and, eq, or } from "drizzle-orm";
import { db, conversationsTable, safetyTable } from "@workspace/db";
import { GetConversationsResponse, StartConversationBody, StartConversationResponse, GetMessagesParams, GetMessagesResponse, SendMessageParams, SendMessageBody, SendMessageResponse, SafetyActionBody } from "@workspace/api-zod";
import { requireUser } from "../middlewares/session";
import { assertContact, conversationMessages, conversationView, ensureConversation, id, ownConversation, personRow } from "../lib/domain";
import { postMessage } from "../lib/network";

const router: IRouter = Router();
router.use(["/conversations", "/safety"], requireUser);
router.get("/conversations", async (req, res) => {
  const user = req.cpUser!;
  const convs = await db.select().from(conversationsTable).where(or(eq(conversationsTable.firstId, user.id), eq(conversationsTable.secondId, user.id)));
  const views = await Promise.all(convs.map(c => conversationView(c, user)));
  res.json(GetConversationsResponse.parse(views.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))));
});
router.post("/conversations", async (req, res) => {
  const body = StartConversationBody.parse(req.body);
  const user = req.cpUser!;
  const conv = await ensureConversation(user.id, body.personId);
  res.json(StartConversationResponse.parse(await conversationView(conv, user)));
});
router.get("/conversations/:id/messages", async (req, res) => {
  const { id } = GetMessagesParams.parse(req.params);
  await ownConversation(req.cpUser!.id, id);
  const messages = await conversationMessages(id);
  res.json(GetMessagesResponse.parse(messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() }))));
});
router.post("/conversations/:id/messages", async (req, res) => {
  const { id } = SendMessageParams.parse(req.params);
  const { text } = SendMessageBody.parse(req.body);
  if (!text.trim()) { res.status(400).json({ error: "Write a message first." }); return; }
  res.json(SendMessageResponse.parse(await postMessage(req.cpUser!, id, text)));
});
router.post("/safety", async (req, res) => {
  const body = SafetyActionBody.parse(req.body);
  const user = req.cpUser!;
  await personRow(body.personId);
  if (body.action === "unblock") {
    await db.delete(safetyTable).where(and(eq(safetyTable.userId, user.id), eq(safetyTable.personId, body.personId), eq(safetyTable.action, "block")));
  } else {
    if (body.action === "block") await assertContact(user.id, body.personId);
    await db.insert(safetyTable).values({ id: id(), userId: user.id, personId: body.personId, action: body.action, reason: body.reason?.slice(0, 2000) || "" });
  }
  res.json({ ok: true });
});
export default router;
