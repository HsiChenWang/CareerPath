import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { Gap, GapStep } from "@workspace/api-client-react";
import { Tag } from "@/components/bits";
import { isOptionalTask, taskListCategory } from "@/lib/cp";

const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
type ClassYear = (typeof CLASS_YEARS)[number];
type Semester = "First semester" | "Second semester";

function classYearFromProfile(value?: string): ClassYear | "" {
  const normalized = value?.toLowerCase() ?? "";
  return CLASS_YEARS.find((year) => normalized.includes(year.toLowerCase())) ?? "";
}

function futureSemesters(year: ClassYear, currentSemester: Semester) {
  const currentIndex = CLASS_YEARS.indexOf(year) * 2 + (currentSemester === "First semester" ? 0 : 1);
  return Array.from({ length: Math.max(0, 7 - currentIndex) }, (_, offset) => {
    const index = currentIndex + offset + 1;
    const classYear = CLASS_YEARS[Math.floor(index / 2)]!;
    const semester: Semester = index % 2 === 0 ? "First semester" : "Second semester";
    return { key: `${classYear}-${semester}`, classYear, semester, label: `${semester}, ${classYear} year` };
  });
}

function phaseForTask(step: GapStep, currentYear: ClassYear): number {
  if (currentYear === "Senior") {
    if (step.category === "internship" || step.category === "transition") return 0;
    if (step.category === "growth") return 1;
    if (step.category === "course" || step.category === "project" || step.category === "research" || step.category === "skill") return 2;
    return 3;
  }
  if (step.category === "club") return 0;
  if (step.category === "course") return step.id.endsWith("-course-advanced") ? 1 : 0;
  if (step.category === "case-competition" || step.category === "certificate") return 1;
  if (step.category === "project" || step.category === "research") return 2;
  if (step.category === "skill") return 3;
  if (step.id.endsWith("-internship-presentation")) return 5;
  if (step.category === "internship") return 4;
  if (step.category === "transition") return step.id.endsWith("-first-job") ? 5 : 6;
  if (step.category === "growth") return 6;
  return 3;
}

function termIndexForPhase(phase: number, termCount: number): number {
  if (termCount <= 1) return 0;
  if (termCount === 2) return phase <= 2 ? 0 : 1;
  if (termCount === 3) return phase <= 1 ? 0 : phase <= 4 ? 1 : 2;
  return Math.min(termCount - 1, Math.floor((phase * termCount) / 7));
}

export function TimelinePlan({
  gap,
  profileYear,
  onAsk,
}: {
  gap: Gap;
  profileYear?: string;
  onAsk?: (step: GapStep) => void;
}) {
  const [yearOverride, setYearOverride] = useState<ClassYear | "">("");
  const [currentSemester, setCurrentSemester] = useState<Semester>("First semester");
  const currentYear = yearOverride || classYearFromProfile(profileYear);
  const terms = currentYear ? futureSemesters(currentYear, currentSemester) : [];
  const openTasks = gap.steps.filter((step) => !step.done);
  const plannedTerms = terms.map((term) => ({ ...term, tasks: [] as GapStep[] }));

  if (currentYear && plannedTerms.length) {
    const orderedTasks = [...openTasks].sort((a, b) =>
      phaseForTask(a, currentYear) - phaseForTask(b, currentYear)
      || Number(isOptionalTask(a)) - Number(isOptionalTask(b))
      || a.title.localeCompare(b.title),
    );
    for (const step of orderedTasks) {
      const phase = phaseForTask(step, currentYear);
      const termIndex = termIndexForPhase(phase, plannedTerms.length);
      plannedTerms[termIndex]!.tasks.push(step);
    }
  }

  const maxTasksPerTerm = 5;
  const plannedCount = plannedTerms.reduce((sum, term) => sum + Math.min(term.tasks.length, maxTasksPerTerm), 0);
  const remainingCount = Math.max(0, openTasks.length - plannedCount);

  return (
    <section className="rounded-[1.75rem] border bg-card p-5 md:p-6" aria-labelledby="timeline-plan-title" data-testid="panel-timeline-plan">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cardinal"><CalendarDays className="h-4 w-4" />Timeline plan</p>
          <h3 id="timeline-plan-title" className="mt-1 font-display text-2xl">Plan by semester</h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Choose your current point in school. Open tasks are placed in the semesters that follow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Current year
            <select
              value={currentYear}
              onChange={(event) => setYearOverride(event.target.value as ClassYear | "")}
              className="h-10 min-w-32 rounded-xl border bg-background px-3 text-sm text-foreground"
              aria-label="Current class year"
              data-testid="select-timeline-year"
            >
              <option value="">Choose year</option>
              {CLASS_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Current semester
            <select
              value={currentSemester}
              onChange={(event) => setCurrentSemester(event.target.value as Semester)}
              className="h-10 min-w-36 rounded-xl border bg-background px-3 text-sm text-foreground"
              aria-label="Current semester"
              data-testid="select-timeline-semester"
            >
              <option value="First semester">First semester</option>
              <option value="Second semester">Second semester</option>
            </select>
          </label>
        </div>
      </div>

      {!currentYear ? (
        <p className="mt-5 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground" data-testid="text-timeline-select-year">Select your current class year to build the semester plan.</p>
      ) : !terms.length ? (
        <p className="mt-5 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground" data-testid="text-timeline-no-future">You’re in the final semester shown. Use the task lists below to prioritize anything still open.</p>
      ) : !openTasks.length ? (
        <p className="mt-5 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground" data-testid="text-timeline-no-open-tasks">All tasks are marked done. Reopen a task in its category list to add it back to the plan.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {plannedTerms.map((term, index) => {
            const tasks = term.tasks.slice(0, maxTasksPerTerm);
            return (
              <section key={term.key} className="relative rounded-2xl border bg-background p-4 md:p-5" data-testid={`timeline-term-${term.key.toLowerCase().replaceAll(" ", "-")}`}>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-display text-lg">{term.label}</h4>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Term {index + 1}</span>
                </div>
                {tasks.length ? (
                  <ol className="mt-3 space-y-3">
                    {tasks.map((step) => (
                      <li key={step.id} className="rounded-xl bg-muted/50 p-3" data-testid={`timeline-task-${step.id}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{step.title}</p>
                          <Tag tone="muted">{taskListCategory(step)}</Tag>
                          {isOptionalTask(step) && <Tag tone="muted">Optional</Tag>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                        {onAsk && <button type="button" onClick={() => onAsk(step)} className="mt-2 text-xs font-semibold text-cardinal hover:underline" data-testid={`button-help-timeline-${step.id}`}>Help me plan this</button>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No open tasks are scheduled for this semester. Keep building experience and revisit the category lists.</p>
                )}
              </section>
            );
          })}
          {remainingCount > 0 && <p className="text-xs text-muted-foreground" data-testid="text-timeline-overflow">{remainingCount} additional open task{remainingCount === 1 ? "" : "s"} remain in the category lists; this plan shows up to {maxTasksPerTerm} priorities per semester.</p>}
        </div>
      )}
    </section>
  );
}
