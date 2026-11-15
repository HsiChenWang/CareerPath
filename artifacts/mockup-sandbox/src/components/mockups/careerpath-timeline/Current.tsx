import "./_group.css";
import { useState } from "react";
import { CalendarDays } from "lucide-react";

const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
type ClassYear = (typeof CLASS_YEARS)[number];
type Semester = "First semester" | "Second semester";
type Step = { id: string; title: string; description: string; category: string; done: boolean };

const steps: Step[] = [
  { id: "finance-course", title: "Complete a finance or analytics course", description: "Build the fundamentals used in entry-level business roles.", category: "course", done: false },
  { id: "industry-club", title: "Join a relevant student organization", description: "Find a team where you can contribute to real projects.", category: "club", done: false },
  { id: "excel-certificate", title: "Earn an Excel modeling certificate", description: "Practice the tools that show up in internship interviews.", category: "certificate", done: false },
  { id: "advanced-course", title: "Build a data story with SQL", description: "Turn a small dataset into a clear recommendation.", category: "course", done: false },
  { id: "case-competition", title: "Enter a student case competition", description: "Work through a business problem with a cross-functional team.", category: "case-competition", done: false },
  { id: "portfolio-project", title: "Create a portfolio project", description: "Show the question, analysis, and result in one concise case study.", category: "project", done: false },
  { id: "summer-internship", title: "Apply to summer internships", description: "Target roles that match your coursework and project experience.", category: "internship", done: false },
  { id: "internship-presentation", title: "Present your internship impact", description: "Document the work, measurable result, and lessons learned.", category: "internship", done: false },
  { id: "first-job", title: "Start a full-time job search", description: "Build a focused shortlist and tailor your application materials.", category: "transition", done: false },
  { id: "alumni-growth", title: "Ask an alum for a career conversation", description: "Use a specific question to learn about a role or team.", category: "growth", done: false },
];

function futureSemesters(year: ClassYear, currentSemester: Semester) {
  const currentIndex = CLASS_YEARS.indexOf(year) * 2 + (currentSemester === "First semester" ? 0 : 1);
  return Array.from({ length: Math.max(0, 7 - currentIndex) }, (_, offset) => {
    const index = currentIndex + offset + 1;
    const classYear = CLASS_YEARS[Math.floor(index / 2)]!;
    const semester: Semester = index % 2 === 0 ? "First semester" : "Second semester";
    return { key: `${classYear}-${semester}`, label: `${semester}, ${classYear} year`, tasks: [] as Step[] };
  });
}

function phaseForTask(step: Step, currentYear: ClassYear): number {
  if (currentYear === "Senior") {
    if (step.category === "internship" || step.category === "transition") return 0;
    if (step.category === "growth") return 1;
    if (step.category === "course" || step.category === "project") return 2;
    return 3;
  }
  if (step.category === "club") return 0;
  if (step.category === "course") return step.id.endsWith("-advanced") ? 1 : 0;
  if (step.category === "case-competition" || step.category === "certificate") return 1;
  if (step.category === "project") return 2;
  if (step.id.endsWith("-internship-presentation")) return 5;
  if (step.category === "internship") return 4;
  if (step.category === "transition") return 5;
  if (step.category === "growth") return 6;
  return 3;
}

function termIndexForPhase(phase: number, count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return phase <= 2 ? 0 : 1;
  if (count === 3) return phase <= 1 ? 0 : phase <= 4 ? 1 : 2;
  return Math.min(count - 1, Math.floor((phase * count) / 7));
}

function CurrentTimeline() {
  const [currentYear, setCurrentYear] = useState<ClassYear>("Junior");
  const [currentSemester, setCurrentSemester] = useState<Semester>("First semester");
  const terms = futureSemesters(currentYear, currentSemester);
  for (const step of steps) {
    const index = termIndexForPhase(phaseForTask(step, currentYear), terms.length);
    terms[index]?.tasks.push(step);
  }

  return (
    <section className="w-full rounded-[1.75rem] border bg-card p-5 shadow-sm md:p-6" aria-labelledby="current-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cardinal"><CalendarDays className="h-4 w-4" />Timeline plan</p>
          <h2 id="current-title" className="mt-1 font-display text-2xl">Plan by semester</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Choose your current point in school. Open tasks are placed in the semesters that follow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Current year
            <select value={currentYear} onChange={(event) => setCurrentYear(event.target.value as ClassYear)} className="h-10 min-w-32 rounded-xl border bg-background px-3 text-sm text-foreground">
              {CLASS_YEARS.map((year) => <option key={year}>{year}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Current semester
            <select value={currentSemester} onChange={(event) => setCurrentSemester(event.target.value as Semester)} className="h-10 min-w-36 rounded-xl border bg-background px-3 text-sm text-foreground">
              <option>First semester</option>
              <option>Second semester</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {terms.map((term, index) => (
          <section key={term.key} className="rounded-2xl border bg-background p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg">{term.label}</h3>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Term {index + 1}</span>
            </div>
            <ol className="mt-3 space-y-3">
              {term.tasks.slice(0, 5).map((step) => (
                <li key={step.id} className="rounded-xl bg-muted/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{step.title}</p>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/75">{step.category}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}

export function Current() {
  return <main className="min-h-screen bg-background p-4 text-foreground md:p-6"><CurrentTimeline /></main>;
}
