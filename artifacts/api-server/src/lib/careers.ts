import { eq } from "drizzle-orm";
import { db, peopleTable, type PersonRow } from "@workspace/db";
import { FindPathResponse, type CareerPath, type Gap, type Person, type PathStep } from "@workspace/api-zod";
import { publicPerson, similarity, isBlocked } from "./domain";
import { aiJson } from "./ai";
import { z } from "zod";

const matchCache = new Map<string, { at: number; people: Person[] }>();
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function roleMatches(actual: string, goal: string) {
  if (!words(actual) || !words(goal)) return false;
  const aliases: Record<string, string> = { pm: "product manager", swe: "software engineer", ib: "investment banking", "software engineering": "software engineer", "product management": "product manager", "investment banker": "investment banking", consulting: "consultant", marketing: "marketing" };
  const g = aliases[words(goal)] ?? words(goal);
  return words(actual).includes(g) || g.includes(words(actual));
}
export async function rankedPeople(userRow: PersonRow, kind: string, search = "", school = "", company = "") {
  const user = publicPerson(userRow);
  const all = await db.select().from(peopleTable).where(eq(peopleTable.role, kind === "peers" ? "student" : "alumni"));
  const visible: Person[] = [];
  for (const row of all) {
    if (row.id === user.id || await isBlocked(user.id, row.id)) continue;
    const p = publicPerson(row);
    if (search && !words(`${p.name} ${p.major} ${p.currentRole} ${p.company} ${p.clubs.join(" ")}`).includes(words(search))) continue;
    if (school && school !== "all" && school !== "All schools" && p.school !== school) continue;
    if (company && company !== "all" && company !== "All companies" && !words(p.company || "").includes(words(company))) continue;
    const fit = similarity(user, p);
    visible.push({ ...p, fitScore: fit.score, fitReason: fit.reason });
  }
  visible.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
  let selected = visible;
  if (kind === "explore") {
    const categories = ["Entrepreneurship", "Product management", "Software engineering", "AI hardware", "Research", "Creative technology"];
    const used = new Set<string>();
    selected = [];
    for (const category of categories) {
      const p = visible.find(x => x.outcome === category && !used.has(x.id));
      if (p) { selected.push(p); used.add(p.id); }
    }
    for (const p of visible) {
      if (selected.length >= 6) break;
      if (!used.has(p.id) && !selected.some(x => x.outcome === p.outcome)) selected.push(p);
    }
  } else if (kind === "alumni") selected = selected.slice(0, 5);
  if (!selected.length) return [];
  const key = JSON.stringify([user.id, userRow.profile, kind, search, school, company, selected.map(x => x.id)]);
  const cache = matchCache.get(key);
  if (cache && Date.now() - cache.at < 600000) return cache.people;
  const fitSchema = z.object({ reasons: z.array(z.object({ id: z.string(), reason: z.string() })) });
  const result = await aiJson("For each candidate explain in one specific sentence why their USC STARTING profile fits this student's interests/background. Cite genuine shared clubs/major/skills/courses or distinguish a different starting point honestly. For peers suggest a concrete collaborative activity. JSON {reasons:[{id,reason}]}; do not invent facts. Keep every supplied id.", { student: user, candidates: selected }, x => fitSchema.parse(x), { reasons: [] });
  const people = selected.map(p => ({ ...p, fitReason: result.value.reasons.find(x => x.id === p.id)?.reason || p.fitReason }));
  matchCache.set(key, { at: Date.now(), people });
  if (matchCache.size > 150) matchCache.delete(matchCache.keys().next().value!);
  return people;
}
function commonSteps(alumni: Person[], role: string): PathStep[] {
  if (!alumni.length) return [];
  const top = (arrays: string[][]) => {
    const counts = new Map<string, number>();
    for (const array of arrays) for (const s of new Set(array)) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0] ?? ["", 0] as [string, number];
  };
  const [club, clubCount] = top(alumni.map(x => x.clubs));
  const [course, courseCount] = top(alumni.map(x => x.courses));
  const [skill, skillCount] = top(alumni.map(x => x.skills));
  const events = (category: string) => alumni.filter(x => x.timeline.some(t => t.category === category)).length;
  const prefix = words(role).replaceAll(" ", "-");
  const total = alumni.length;
  return [
    { id: `${prefix}-club`, stage: "Freshman year", title: `Find your community: ${club}`, description: `Join peers, work on projects, and build early relationships. ${clubCount} of ${total} matched alumni joined ${club}.`, count: clubCount, total, category: "club", keywords: [club] },
    { id: `${prefix}-course`, stage: "Freshman → sophomore", title: course, description: `${courseCount} of ${total} completed this foundation before progressing to advanced work.`, count: courseCount, total, category: "course", keywords: [course] },
    { id: `${prefix}-project`, stage: "Sophomore year", title: "Get hands-on project or research experience", description: "Apply classroom skills through a student-led project, lab, or research role.", count: events("project"), total, category: "project", keywords: ["research", "project", "built", "assistant"] },
    { id: `${prefix}-internship`, stage: "Junior summer", title: "Complete a relevant summer internship", description: "Develop real-world skills with a team; ask about return offers and mentorship.", count: events("internship"), total, category: "internship", keywords: ["intern", "summer analyst"] },
    { id: `${prefix}-skill`, stage: "Junior → senior", title: `Build confidence with ${skill}`, description: `${skillCount} of ${total} list ${skill} among the skills they developed along the way.`, count: skillCount, total, category: "skill", keywords: [skill] },
    { id: `${prefix}-first-job`, stage: "First job → your goal", title: `Build toward ${role}`, description: "Use your first full-time role to deepen a specialty, seek feedback, and build relationships.", count: events("first-job"), total, category: "first-job", keywords: [role] },
  ];
}
export function gapFor(user: PersonRow): Gap {
  const p = publicPerson(user);
  const path = user.path ? FindPathResponse.parse(user.path) : null;
  if (!path) return { role: p.dreamRole || "", company: p.dreamCompany || "", completed: 0, total: 0, steps: [], actions: [] };
  const steps = path.steps.map(step => {
    let source: string[] = [];
    switch (step.category) {
      case "club": source = p.clubs; break;
      case "course": source = p.courses; break;
      case "skill": source = p.skills; break;
      case "first-job": source = [p.currentRole || "", ...p.experience.filter(x => !/intern|research|assistant|project/i.test(x))]; break;
      default: source = p.experience;
    }
    const inferred = step.keywords.some(k => source.some(s => words(s).includes(words(k))));
    return { ...step, done: user.completed[step.id] ?? inferred };
  });
  for (let i = 0; i < user.extraActions.length; i++) {
    const action = user.extraActions[i]!;
    steps.push({
      id: `advice-${i}`, stage: "From your coffee chats", title: action,
      description: "Advice saved from a conversation with a Trojan.", count: 1, total: 1,
      category: "advice", keywords: [], done: user.completed[`advice-${i}`] ?? false,
    });
  }
  const storedActions = (user.path as Record<string, unknown>).actions;
  const actions = Array.isArray(storedActions) ? storedActions.filter((x): x is string => typeof x === "string").slice(0, 3) : [];
  return {
    role: path.role, company: path.company, completed: steps.filter(x => x.done).length, total: steps.length, steps,
    actions: actions.length ? actions : steps.filter(x => !x.done).slice(0, 3).map(x => `This semester: ${x.title.toLowerCase()}. Start with one small action this week.`),
  };
}
export async function makePath(user: PersonRow, role: string, company = "") {
  const all = await db.select().from(peopleTable).where(eq(peopleTable.role, "alumni"));
  const alumni = all.map(publicPerson).filter(p =>
    (roleMatches(p.currentRole || "", role) || p.timeline.some(t => roleMatches(t.title, role)))
    && (!company || words(p.company || "").includes(words(company)) || p.timeline.some(t => words(t.title).includes(words(company)))),
  );
  const steps = commonSteps(alumni, role);
  const baseline: CareerPath = {
    role, company, total: alumni.length, alumni, steps, fallback: true,
    summary: alumni.length ? `Across ${alumni.length} sample Trojans who reached ${role}${company ? ` at ${company}` : ""}, the recurring pattern is community involvement, foundational coursework, hands-on work and a relevant internship. These are common steps, not a guaranteed or mandatory route.` : `No sample alumni match ${role}${company ? ` at ${company}` : ""} yet. Try a broader role or one of our sample paths: Product Manager at Google, Investment Banking Analyst at Goldman Sachs, Consultant at McKinsey, Software Engineer at Apple, or Marketing at Disney.`,
  };
  let result = { value: { summary: baseline.summary, actions: [] as string[] }, fallback: true };
  if (alumni.length) {
    const schema = z.object({ summary: z.string(), actions: z.array(z.string()).length(3) });
    result = await aiJson("Analyze alumni year-by-year paths. JSON {summary:string,actions:[3 concrete personalized next steps for THIS semester]}. Summarize actual common patterns and when they happen, no invented counts. Actions must address the student's gaps and include a specific achievable first move. Paths are descriptive, not guarantees.", { student: publicPerson(user), goal: { role, company }, evidence: steps, alumni }, x => schema.parse(x), result.value);
  }
  const path = { ...baseline, summary: result.value.summary, fallback: result.fallback };
  const p = publicPerson(user);
  await db.update(peopleTable).set({
    profile: { ...(user.profile as object), dreamRole: role, dreamCompany: company },
    path: { ...path, actions: result.value.actions },
  }).where(eq(peopleTable.id, p.id));
  return path;
}
