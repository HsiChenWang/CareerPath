import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, peopleTable } from "@workspace/db";
import { SaveProfileBody, SaveProfileResponse, GetPeopleQueryParams, GetPeopleResponse, GetPersonParams, GetPersonResponse, FindPathBody, FindPathResponse, GetGapResponse, UpdateGapStepParams, UpdateGapStepBody } from "@workspace/api-zod";
import { requireUser } from "../middlewares/session";
import { HttpError, isBlocked, personRow, publicPerson, publicPersonWithDemoContacts, similarity } from "../lib/domain";
import { gapFor, makePath, rankedPeople, ROADMAP_VERSION } from "../lib/careers";
import { milestoneFollowups } from "../lib/network";

const router: IRouter = Router();
router.use(["/profile", "/people", "/path", "/gap"], requireUser);
router.patch("/profile", async (req, res) => {
  const input = SaveProfileBody.parse(req.body);
  const user = req.cpUser!;
  if (input.name !== undefined && (!input.name.trim() || input.name.length > 100)) throw new HttpError(400, "Please enter your name.");
  if (input.availability?.some(t => !Number.isFinite(Date.parse(t)))) throw new HttpError(400, "Availability must contain valid dates and times.");
  const schools = ["Marshall", "Viterbi", "Dornsife", "Annenberg", "Rossier", "Cinematic Arts", "Thornton", "Other"];
  if (input.school && !schools.includes(input.school)) throw new HttpError(400, "Choose a USC school.");
  const profile = { ...(user.profile as object), ...input };
  const goalChanged = input.dreamRole !== undefined && input.dreamRole !== publicPerson(user).dreamRole
    || input.dreamCompany !== undefined && input.dreamCompany !== publicPerson(user).dreamCompany
    || input.dreamIndustry !== undefined && input.dreamIndustry !== publicPerson(user).dreamIndustry;
  const [saved] = await db.update(peopleTable).set({ profile, name: input.name?.trim() || user.name, ...(goalChanged ? { path: null } : {}) }).where(eq(peopleTable.id, user.id)).returning();
  res.json(SaveProfileResponse.parse(publicPerson(saved!)));
});
router.get("/people", async (req, res) => {
  const query = GetPeopleQueryParams.parse(req.query);
  res.json(GetPeopleResponse.parse(await rankedPeople(req.cpUser!, query.kind || "alumni", query.search, query.school, query.company)));
});
router.get("/people/:id", async (req, res) => {
  const { id } = GetPersonParams.parse(req.params);
  const user = req.cpUser!;
  if (await isBlocked(user.id, id)) throw new HttpError(403, "This connection is blocked. You can unblock them from your conversation.");
  const person = publicPersonWithDemoContacts(await personRow(id));
  const fit = similarity(publicPerson(user), person);
  res.json(GetPersonResponse.parse({ ...person, fitReason: fit.reason, fitScore: fit.score }));
});
router.post("/path", async (req, res) => {
  const body = FindPathBody.parse(req.body);
  if (!body.role.trim() || body.role.length > 150 || (body.company?.length ?? 0) > 150 || (body.industry?.length ?? 0) > 120) throw new HttpError(400, "Enter a career role under 150 characters and keep company and industry under their limits.");
  res.json(FindPathResponse.parse(await makePath(req.cpUser!, body.role.trim(), body.company?.trim(), body.industry?.trim())));
});
router.get("/gap", async (req, res) => {
  let user = req.cpUser!;
  const p = publicPerson(user);
  const storedPath = user.path as { role?: string; company?: string; industry?: string; roadmapVersion?: number } | null;
  const pathRole = storedPath?.role || p.dreamRole;
  const pathCompany = storedPath?.company || p.dreamCompany;
  const pathIndustry = storedPath?.industry || p.dreamIndustry;
  if (pathRole && storedPath?.roadmapVersion !== ROADMAP_VERSION) {
    await makePath(user, pathRole, pathCompany, pathIndustry);
    user = await personRow(user.id);
  }
  const gap = gapFor(user);
  // Advice from completed chats remains useful even before a goal is chosen.
  if (!gap.total && user.extraActions.length) {
    gap.steps = user.extraActions.map((title, i) => ({ id: `advice-${i}`, stage: "From your coffee chats", title, description: "Advice from a Trojan to act on this semester.", category: "advice", count: 1, total: 1, keywords: [], done: user.completed[`advice-${i}`] ?? false }));
    gap.completed = gap.steps.filter(x => x.done).length;
    gap.total = gap.steps.length;
    gap.actions = gap.steps.filter(x => !x.done).slice(0, 3).map(x => x.title);
  }
  res.json(GetGapResponse.parse(gap));
});
router.patch("/gap/:id", async (req, res) => {
  const { id } = UpdateGapStepParams.parse(req.params);
  const body = UpdateGapStepBody.parse(req.body);
  const user = req.cpUser!;
  const gap = gapFor(user);
  const title = gap.steps.find(s => s.id === id)?.title || (id.startsWith("advice-") ? user.extraActions[Number(id.slice(7))] : undefined);
  if (!title) throw new HttpError(404, "Step not found. Choose a path first.");
  const [saved] = await db.update(peopleTable).set({ completed: { ...user.completed, [id]: body.done } }).where(eq(peopleTable.id, user.id)).returning();
  if (body.done && !user.completed[id]) await milestoneFollowups(saved!, title, id);
  const updatedGap = gapFor(saved!);
  if (!updatedGap.total && saved!.extraActions.length) {
    updatedGap.steps = saved!.extraActions.map((title, i) => ({ id: `advice-${i}`, title, stage: "From your coffee chats", description: "Advice from a Trojan.", category: "advice", count: 1, total: 1, keywords: [], done: saved!.completed[`advice-${i}`] ?? false }));
    updatedGap.total = updatedGap.steps.length;
    updatedGap.completed = updatedGap.steps.filter(s => s.done).length;
    updatedGap.actions = updatedGap.steps.filter(s => !s.done).slice(0, 3).map(s => s.title);
  }
  res.json(GetGapResponse.parse(updatedGap));
});
export default router;
