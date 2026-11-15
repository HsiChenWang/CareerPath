import { CalendarDays } from "lucide-react";
import type { Gap, GapStep } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Tag } from "@/components/bits";
import { isOptionalTask, taskListCategory, type TaskListCategory } from "@/lib/cp";

const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
type ClassYear = (typeof CLASS_YEARS)[number];
type Semester = "First semester" | "Second semester";

const TERM_STYLES = [
  {
    card: "border-[#dfb83c] from-[#fff1bf] to-[#fffdf5] dark:from-[#3b3010] dark:to-[#241e11]",
    marker: "bg-[#ffcc00] text-[#3c2c00]",
    rail: "bg-[#d4a900]",
  },
  {
    card: "border-[#c7697c] from-[#fae1e5] to-[#fff8f7] dark:from-[#451b27] dark:to-[#241719]",
    marker: "bg-[#9a1230] text-white",
    rail: "bg-[#9a1230]",
  },
  {
    card: "border-[#6b9e96] from-[#dff0ed] to-[#f8fcfa] dark:from-[#183632] dark:to-[#17231f]",
    marker: "bg-[#23695f] text-white",
    rail: "bg-[#23695f]",
  },
] as const;

const CATEGORY_COLORS: Record<TaskListCategory, string> = {
  Courses: "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100",
  "Club Experiences": "border-rose-200 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100",
  Internships: "border-sky-200 bg-sky-100 text-sky-950 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100",
  "Case Competitions": "border-orange-200 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-100",
  Certificates: "border-violet-200 bg-violet-100 text-violet-950 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-100",
};

function classYearFromProfile(value?: string): ClassYear | "" {
  const normalized = value?.toLowerCase() ?? "";
  return CLASS_YEARS.find((year) => normalized.includes(year.toLowerCase())) ?? "";
}

function semesterFromCurrentDate(date = new Date()): Semester {
  const month = date.getMonth();
  return month >= 7 ? "First semester" : "Second semester";
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
  const currentYear = classYearFromProfile(profileYear);
  const currentSemester = semesterFromCurrentDate();
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
    <section className="overflow-hidden rounded-[1.75rem] border border-cardinal/20 bg-card shadow-[0_22px_60px_-36px_rgba(69,0,18,0.5)]" aria-labelledby="timeline-plan-title" data-testid="panel-timeline-plan">
      <header className="relative overflow-hidden bg-gradient-to-br from-cardinal-deep via-cardinal to-ink px-5 py-6 text-white md:px-7 md:py-7">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[30px] border-gold/15" />
        <div aria-hidden="true" className="absolute bottom-0 right-28 h-20 w-20 rotate-45 border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold"><CalendarDays className="h-4 w-4" />CareerPath roadmap</p>
            <h3 id="timeline-plan-title" className="mt-2 font-display text-3xl leading-tight md:text-4xl">Your next chapters</h3>
            <p className="mt-2 text-sm text-white/75">A semester plan built around your profile and today’s date.</p>
          </div>
          {currentYear && (
            <div className="relative rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gold">Starting point</p>
              <p className="mt-1 font-semibold">{currentYear} <span className="text-white/50">·</span> {currentSemester}</p>
              <p className="mt-1 text-[11px] text-white/65">Set automatically</p>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-5 md:px-7 md:py-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cardinal">Your roadmap</p>
            <h4 className="mt-1 font-display text-2xl">Plan by semester</h4>
          </div>
          {terms.length > 0 && <p className="rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-ink">{terms.length} semester{terms.length === 1 ? "" : "s"} ahead</p>}
        </div>

        {!currentYear ? (
          <div className="rounded-2xl border border-gold/50 bg-gold-soft/50 p-4 text-sm text-ink" data-testid="text-timeline-select-year">
            Add your class year to your profile to generate a semester plan.
            <Link href="/profile" className="ml-1 font-semibold text-cardinal underline underline-offset-2" data-testid="link-timeline-profile">Update profile</Link>
          </div>
        ) : !terms.length ? (
          <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground" data-testid="text-timeline-no-future">You’re in the final semester shown. Use the task lists below to prioritize anything still open.</p>
        ) : !openTasks.length ? (
          <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground" data-testid="text-timeline-no-open-tasks">All tasks are marked done. Reopen a task in its category list to add it back to the plan.</p>
        ) : (
          <div className="space-y-4">
          {plannedTerms.map((term, index) => {
            const tasks = term.tasks.slice(0, maxTasksPerTerm);
            const style = TERM_STYLES[index % TERM_STYLES.length]!;
            return (
              <section key={term.key} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md md:p-5 ${style.card}`} data-testid={`timeline-term-${term.key.toLowerCase().replaceAll(" ", "-")}`}>
                <div className={`absolute bottom-7 left-[1.45rem] top-[5.2rem] w-0.5 opacity-40 ${style.rail}`} aria-hidden="true" />
                <div className="relative flex items-start gap-3">
                  <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-4 ring-white/70 dark:ring-black/20 ${style.marker}`}>{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="font-display text-lg leading-tight md:text-xl">{term.label}</h5>
                      </div>
                      <span className="rounded-full border border-white/75 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground/70 dark:border-white/10 dark:bg-black/20">Term {index + 1}</span>
                    </div>
                    {tasks.length ? (
                      <ol className="mt-4 space-y-2.5">
                        {tasks.map((step) => {
                          const category = taskListCategory(step);
                          return (
                            <li key={step.id} className="relative rounded-xl border border-white/80 bg-background/80 p-3 shadow-sm backdrop-blur-sm dark:border-white/10" data-testid={`timeline-task-${step.id}`}>
                              <span className={`absolute -left-[1.58rem] top-4 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#211b1b] ${style.rail}`} aria-hidden="true" />
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold leading-snug">{step.title}</p>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[category]}`}>{category}</span>
                                {isOptionalTask(step) && <Tag tone="gold">Optional</Tag>}
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                              {onAsk && <button type="button" onClick={() => onAsk(step)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cardinal transition-colors hover:text-cardinal-deep hover:underline" data-testid={`button-help-timeline-${step.id}`}>Help me plan this</button>}
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p className="mt-4 rounded-xl border border-white/70 bg-background/70 p-3 text-sm text-muted-foreground dark:border-white/10">No open tasks are scheduled for this semester. Keep building experience and revisit the category lists.</p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
          {remainingCount > 0 && <p className="rounded-xl bg-muted/70 px-4 py-3 text-xs text-muted-foreground" data-testid="text-timeline-overflow">{remainingCount} additional open task{remainingCount === 1 ? "" : "s"} remain in the category lists; this plan shows up to {maxTasksPerTerm} priorities per semester.</p>}
          </div>
        )}
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cardinal" />
          <p>Completed tasks leave the timeline but stay checked in their category list.</p>
        </div>
      </div>
    </section>
  );
}
