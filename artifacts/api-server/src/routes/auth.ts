import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { db, peopleTable } from "@workspace/db";
import { DemoLoginBody, LoginBody, RegisterBody, GetSessionResponse } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { HttpError, id, personRow, publicPerson } from "../lib/domain";
import { setIdentity } from "../middlewares/session";

const router: IRouter = Router();
const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 40, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many sign-in attempts. Please try again later." } });
router.get("/auth/me", async (req, res) => {
  const user = req.session.userId ? await personRow(req.session.userId).catch(() => null) : null;
  res.json(GetSessionResponse.parse({ user: user ? publicPerson(user) : null }));
});
router.post("/auth/demo", authLimit, async (req, res) => {
  const body = DemoLoginBody.parse(req.body);
  const user = await personRow(body.role === "alumni" ? "priya" : "alex");
  await setIdentity(req, user.id);
  res.json({ user: publicPerson(user) });
});
router.post("/auth/login", authLimit, async (req, res) => {
  const body = LoginBody.parse(req.body);
  const [user] = await db.select().from(peopleTable).where(eq(peopleTable.email, body.email.trim().toLowerCase()));
  if (!user?.passwordHash || !await verifyPassword(body.password.slice(0, 1024), user.passwordHash)) throw new HttpError(401, "Email or password is incorrect.");
  await setIdentity(req, user.id);
  res.json({ user: publicPerson(user) });
});
router.post("/auth/register", authLimit, async (req, res) => {
  const body = RegisterBody.parse(req.body);
  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new HttpError(400, "Enter a valid email address.");
  if (!body.name.trim() || body.name.length > 100 || body.password.length > 256) throw new HttpError(400, "Enter a name and a password of 8–256 characters.");
  const [duplicate] = await db.select({ id: peopleTable.id }).from(peopleTable).where(eq(peopleTable.email, email));
  if (duplicate) throw new HttpError(409, "An account with this email already exists. Please sign in.");
  const [user] = await db.insert(peopleTable).values({
    id: id(), email, passwordHash: await hashPassword(body.password), name: body.name.trim(), role: body.role, isDemo: false,
    profile: {
      school: "Other", major: "", level: "Undergrad", year: "", clubs: [], skills: [], interests: [], courses: [], experience: [], timeline: [],
      dreamRole: "", dreamCompany: "", currentRole: body.role === "student" ? "USC Student" : "", company: "", availability: [],
      helpTopics: [], maxChats: 4, openToChat: false, paused: false, bio: "",
    },
  }).returning();
  await setIdentity(req, user!.id);
  res.json({ user: publicPerson(user!) });
});
router.post("/auth/logout", async (req, res) => {
  await new Promise<void>((resolve, reject) => req.session.destroy(err => err ? reject(err) : resolve()));
  res.clearCookie("careerpath.sid", { path: "/" });
  res.json({ ok: true });
});
export default router;
