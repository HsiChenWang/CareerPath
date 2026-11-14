import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { AskAiBody, AskAiResponse } from "@workspace/api-zod";
import { requireUser } from "../middlewares/session";
import { assertContact, conversationMessages, ensureConversation, HttpError, ownConversation, personRow, publicPerson } from "../lib/domain";
import { careerAi } from "../lib/ai";
import { gapFor } from "../lib/careers";
import { ownChat, networkFor } from "../lib/network";

const router: IRouter = Router();
const aiLimit = rateLimit({ windowMs: 15 * 60000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "You've made a lot of AI requests. Please take a short break and try again." } });
router.post("/ai", requireUser, aiLimit, async (req, res) => {
  const body = AskAiBody.parse(req.body);
  const user = req.cpUser!;
  const profile = publicPerson(user);
  const context: Record<string, unknown> = {
    user: profile, page: body.page || "CareerPath", prompt: body.prompt?.slice(0, 4000),
    text: body.text?.slice(0, 18000), goal: body.goal, tone: body.tone, gap: gapFor(user),
    chosenPath: user.path, referralAllowed: false,
  };
  if (body.kind === "weekly") context.network = await networkFor(user);
  let person = null;
  if (body.personId) {
    await assertContact(user.id, body.personId);
    person = publicPerson(await personRow(body.personId));
    context.person = person;
    const conv = await ensureConversation(user.id, person.id);
    const messages = await conversationMessages(conv.id);
    context.referralAllowed = messages.some(m => m.senderId === person!.id) && messages.some(m => m.senderId === user.id);
    context.conversation = messages.map(m => ({ sender: m.senderId === user.id ? profile.name : person!.name, text: m.text }));
  }
  if (body.conversationId) {
    const conv = await ownConversation(user.id, body.conversationId);
    const recipientId = conv.firstId === user.id ? conv.secondId : conv.firstId;
    await assertContact(user.id, recipientId);
    const recipient = publicPerson(await personRow(recipientId));
    const messages = await conversationMessages(conv.id);
    context.conversation = messages.map(m => ({ sender: m.senderId === user.id ? profile.name : recipient.name, text: m.text }));
    context.person = recipient;
    context.referralAllowed = messages.some(m => m.senderId === recipient.id) && messages.some(m => m.senderId === user.id);
  }
  if (body.chatId) {
    const chat = await ownChat(user.id, body.chatId);
    const other = user.id === chat.studentId ? chat.alumniId : chat.studentId;
    await assertContact(user.id, other);
    context.chat = { ...chat, createdAt: chat.createdAt.toISOString() };
    context.person = publicPerson(await personRow(other));
  }
  if (/referral/i.test(body.goal || "") && !context.referralAllowed) throw new HttpError(403, "Have a conversation with this alum before asking about a referral.");
  let fallback = "AI is taking a break. Start with one small step: review a Trojan's path, identify something you share, and ask one specific question. You can keep using all of CareerPath.";
  if (body.kind === "resume") fallback = "Resume autofill is temporarily unavailable. Your resume wasn't saved; please fill the fields manually or try again.";
  if (body.kind === "tips") fallback = "AI profile tips are temporarily unavailable. Include specific project outcomes, skills you used, and what you hope to learn from alumni.";
  if (["draft", "reply", "decline", "followup"].includes(body.kind)) {
    fallback = body.kind === "decline"
      ? `Hi, thanks for reaching out! I'm not able to take a coffee chat right now, but I wish you the best as you explore your next steps. — ${profile.name}`
      : body.kind === "reply" ? "Thanks for your message. I appreciate you sharing your perspective. Could you tell me a little more about the step that helped you most?"
      : `Hi ${person?.name.split(" ")[0] || "there"}, I'm ${profile.name}, a ${profile.major || "USC"} student in ${profile.school}. ${person && profile.clubs.some(c => person!.clubs.includes(c)) ? `I noticed we share ${profile.clubs.find(c => person!.clubs.includes(c))}. ` : ""}I'd love to learn about your path${person?.company ? ` to ${person.company}` : ""}. Would you be open to sharing one piece of advice for someone getting started?`;
  }
  const result = await careerAi(body.kind, context, fallback);
  if (["draft", "reply", "decline", "followup"].includes(body.kind)) result.text = result.text.split(/\s+/).slice(0, 119).join(" ");
  res.json(AskAiResponse.parse(result));
});
export default router;
