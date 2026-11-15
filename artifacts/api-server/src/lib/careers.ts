import { eq } from "drizzle-orm";
import { db, peopleTable, type PersonRow } from "@workspace/db";
import { FindPathResponse, type CareerPath, type Gap, type Person, type PathStep } from "@workspace/api-zod";
import { publicPerson, similarity, isBlocked } from "./domain";
import { aiJson } from "./ai";
import { z } from "zod";

const matchCache = new Map<string, { at: number; people: Person[] }>();
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const ROADMAP_VERSION = 2;

function roleMatches(actual: string, goal: string) {
  if (!words(actual) || !words(goal)) return false;
  const aliases: Record<string, string> = { pm: "product manager", swe: "software engineer", ib: "investment banking", "software engineering": "software engineer", "product management": "product manager", "investment banker": "investment banking", consulting: "consultant", marketing: "marketing" };
  const g = aliases[words(goal)] ?? words(goal);
  return words(actual).includes(g) || g.includes(words(actual));
}

function careerFamily(value: string) {
  const text = words(value);
  if (/\b(product|apm|founder|startup)\b/.test(text)) return "product";
  if (/\b(investment|banking|finance|banker|financial|consultant|consulting|strategy|marketing|business analyst|program director)\b/.test(text)) return "business";
  if (/\b(research|scientist|researcher)\b/.test(text)) return "research";
  if (/\b(software|developer|swe|programmer|robotics|hardware|game|engineer|engineering|data|technology|technologist)\b/.test(text)) return "technology";
  if (/\b(design|ux|creative|film|producer|media|music|communication|content)\b/.test(text)) return "creative";
  if (/\b(education|teacher|learning)\b/.test(text)) return "education";
  if (/\b(climate|environment|sustainability)\b/.test(text)) return "climate";
  return null;
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
  const ranked = (arrays: string[][]) => {
    const counts = new Map<string, number>();
    for (const array of arrays) for (const s of new Set(array)) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  };
  const clubs = ranked(alumni.map(x => x.clubs));
  const courses = ranked(alumni.map(x => x.courses));
  const skills = ranked(alumni.map(x => x.skills));
  const [club = "", clubCount = 0] = clubs[0] ?? [];
  const [course = "", courseCount = 0] = courses[0] ?? [];
  const [nextCourse = "", nextCourseCount = 0] = courses[1] ?? [];
  const [skill = "", skillCount = 0] = skills[0] ?? [];
  const events = (category: string) => alumni.filter(x => x.timeline.some(t => t.category === category)).length;
  const timelineCount = (test: RegExp) => alumni.filter(x => x.timeline.some(t => test.test(`${t.title} ${t.detail}`))).length;
  const leadershipCount = alumni.filter(x => x.skills.some(s => words(s) === "leadership")).length;
  const internshipBridgeCount = alumni.filter(x => x.timeline.some(t => t.category === "first-job" && /converted an internship/i.test(t.detail))).length;
  const alumniConversationCount = alumni.filter(x => x.timeline.some(t => t.category === "first-job" && /usc alumni conversations/i.test(t.detail))).length;
  const prefix = words(role).replaceAll(" ", "-");
  const total = alumni.length;
  const foundationCourse = course || "a foundational course for your goal";
  const followupCourse = nextCourse || "a second role-relevant course";
  const community = club || "a career-related student community";
  const specialty = skill || "a role-specific skill";
  return [
    { id: `${prefix}-club`, stage: "Explore", title: `Join ${community}`, description: "Attend an event, meet potential collaborators, and choose one way to contribute this semester.", count: clubCount, total, category: "club", keywords: club ? [club] : [] },
    { id: `${prefix}-course`, stage: "Build foundations", title: `Complete ${foundationCourse}`, description: "Use the course to strengthen a foundation that appears in related alumni profiles; save one project or assignment as evidence.", count: courseCount, total, category: "course", keywords: course ? [course] : [] },
    { id: `${prefix}-course-advanced`, stage: "Build foundations", title: `Add ${followupCourse} to your plan`, description: "Choose a second course that deepens your toolkit, then connect its work to a practical project.", count: nextCourseCount, total, category: "course", keywords: nextCourse ? [nextCourse] : [] },
    { id: `${prefix}-project`, stage: "Build evidence", title: "Ship a student-led project", description: "Set a small scope, build with a team, and write down what you made and what changed because of it.", count: timelineCount(/student project/i), total, category: "project", keywords: ["student project", "project"] },
    { id: `${prefix}-research`, stage: "Build evidence", title: "Try a research or lab experience", description: "Ask a faculty member or lab about a small research task where you can learn by doing.", count: timelineCount(/undergraduate research|research assistant|research role/i), total, category: "research", keywords: ["undergraduate research", "research assistant", "lab"] },
    { id: `${prefix}-skill`, stage: "Build evidence", title: `Practice ${specialty}`, description: "Pick one concrete exercise or project that lets you demonstrate this commonly used skill.", count: skillCount, total, category: "skill", keywords: skill ? [skill] : [] },
    { id: `${prefix}-leadership`, stage: "Build evidence", title: "Lead one small initiative", description: "Take ownership of a bounded project, coordinate the people involved, and record the result.", count: leadershipCount, total, category: "skill", keywords: ["leadership"] },
    { id: `${prefix}-internship`, stage: "Gain experience", title: "Complete a relevant internship", description: "Apply your skills with a team; ask for feedback and keep a record of your contributions.", count: events("internship"), total, category: "internship", keywords: ["intern", "summer analyst"] },
    { id: `${prefix}-internship-presentation`, stage: "Gain experience", title: "Present a clear outcome from your internship", description: "Summarize the problem, your contribution, and the result in a short story you can use in interviews.", count: timelineCount(/presented work to a cross-functional team/i), total, category: "internship", keywords: ["presented work", "cross-functional"] },
    { id: `${prefix}-first-job`, stage: "Move toward your goal", title: "Use an internship as a bridge to your first role", description: "Ask about return opportunities and translate your internship work into evidence for your next application.", count: internshipBridgeCount, total, category: "transition", keywords: [] },
    { id: `${prefix}-first-role-network`, stage: "Move toward your goal", title: "Use Trojan conversations to find your first role", description: "Request a short informational conversation, ask for one practical next step, and follow up with what you learned.", count: alumniConversationCount, total, category: "transition", keywords: [] },
    { id: `${prefix}-career-growth`, stage: "Grow into the goal", title: `Build toward ${role} in your first role`, description: "Choose a specialty, seek regular feedback, and take on a small initiative that moves you closer to the work you want.", count: events("growth"), total, category: "growth", keywords: [] },
  ];
}
export function gapFor(user: PersonRow): Gap {
  const p = publicPerson(user);
  const path = user.path ? FindPathResponse.parse(user.path) : null;
  if (!path) return { role: p.dreamRole || "", company: p.dreamCompany || "", completed: 0, total: 0, steps: [], actions: [] };
  const steps = path.steps.map(step => {
    const rate = step.total > 0 ? Math.round((step.count / step.total) * 100) : 0;
    const description = step.description.replace(/\b\d+\s+of\s+\d+(?:\s+matched alumni)?/i, `${rate}% of related alumni`);
    let source: string[] = [];
    switch (step.category) {
      case "club": source = p.clubs; break;
      case "course": source = p.courses; break;
      case "skill": source = p.skills; break;
      case "first-job": source = [p.currentRole || "", ...p.experience.filter(x => !/intern|research|assistant|project/i.test(x))]; break;
      case "transition":
      case "growth": source = []; break;
      default: source = p.experience;
    }
    const inferred = step.keywords.some(k => source.some(s => words(s).includes(words(k))));
    return { ...step, description, done: user.completed[step.id] ?? inferred };
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
  const family = careerFamily(role);
  const related = all.map(publicPerson).filter(p => {
    const exactRole = roleMatches(p.currentRole || "", role) || p.timeline.some(t => roleMatches(t.title, role));
    const sameFamily = family && (careerFamily(p.currentRole || "") === family || careerFamily(p.outcome || "") === family);
    return exactRole || sameFamily;
  });
  const companyMatch = (p: Person) => !!company && (
    words(p.company || "").includes(words(company))
    || p.timeline.some(t => words(t.title).includes(words(company)))
  );
  const exactMatch = (p: Person) => roleMatches(p.currentRole || "", role) || p.timeline.some(t => roleMatches(t.title, role));
  const companyMatches = related.filter(companyMatch).length;
  const alumni = related.sort((a, b) =>
    Number(companyMatch(b)) - Number(companyMatch(a))
    || Number(exactMatch(b)) - Number(exactMatch(a))
    || a.name.localeCompare(b.name),
  );
  const steps = commonSteps(alumni, role);
  const cohortDescription = family ? `the related ${family} career family` : `roles related to ${role}`;
  const baseline: CareerPath = {
    role, company, total: alumni.length, alumni, steps, fallback: true,
    summary: alumni.length ? `Across ${alumni.length} sample Trojans in ${cohortDescription}, common themes include community, coursework, hands-on work, and relevant experience. The steps are descriptive, not mandatory or guaranteed.` : `No sample alumni match ${role}${company ? ` at ${company}` : ""} yet. Try a broader role or one of our sample paths: Product Manager at Google, Investment Banking Analyst at Goldman Sachs, Consultant at McKinsey, Software Engineer at Apple, or Marketing at Disney.`,
  };
  let result = { value: { summary: baseline.summary, actions: [] as string[] }, fallback: true };
  if (alumni.length) {
    const schema = z.object({ summary: z.string(), actions: z.array(z.string()).length(3) });
    result = await aiJson("Analyze the supplied cohort's year-by-year paths. JSON {summary:string,actions:[3 concrete personalized next steps for THIS semester]}. Summarize actual common patterns and when they happen, no invented counts. Some alumni may have adjacent roles; never imply everyone reached the exact goal company. Actions must address the student's gaps and include a specific achievable first move. Paths are descriptive, not guarantees.", { student: publicPerson(user), goal: { role, company, relatedCareerFamily: family, companySpecificMatches: companyMatches, totalRelatedAlumni: alumni.length }, evidence: steps, alumni }, x => schema.parse(x), result.value);
  }
  const companyNote = company ? ` Rates use this broader related-role sample; ${companyMatches} company-specific match${companyMatches === 1 ? "" : "es"} found, prioritized in the alumni list.` : "";
  const path = { ...baseline, summary: `${result.value.summary}${companyNote}`, fallback: result.fallback };
  const p = publicPerson(user);
  await db.update(peopleTable).set({
    profile: { ...(user.profile as object), dreamRole: role, dreamCompany: company },
    path: { ...path, actions: result.value.actions, roadmapVersion: ROADMAP_VERSION },
  }).where(eq(peopleTable.id, p.id));
  return path;
}
