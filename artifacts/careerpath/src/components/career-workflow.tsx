import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Explore", "Path Finder", "My Gap"] as const;
export type CareerWorkflowStep = (typeof STEPS)[number];

export function CareerWorkflowProgress({ current }: { current: CareerWorkflowStep }) {
  const currentIndex = STEPS.indexOf(current);
  const percent = currentIndex === 0 ? 0 : currentIndex === 1 ? 50 : 100;

  return (
    <section className="mb-8 rounded-3xl border bg-card px-5 py-4 md:px-6" aria-label="Career planning workflow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cardinal">Your career workflow</p>
        <p className="text-xs font-medium text-muted-foreground" data-testid="text-workflow-progress">Step {currentIndex + 1} of {STEPS.length}</p>
      </div>
      <div className="relative mt-4">
        <div className="absolute left-5 right-5 top-4 h-0.5 bg-border" aria-hidden="true" />
        <div className="absolute left-5 top-4 h-0.5 bg-cardinal transition-all" style={{ width: `calc((100% - 2.5rem) * ${percent / 100})` }} aria-hidden="true" />
        <ol className="relative grid grid-cols-3 gap-2">
          {STEPS.map((step, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;
            return (
              <li key={step} aria-current={active ? "step" : undefined} className="flex flex-col items-center gap-2 text-center">
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border-2 bg-card text-xs font-semibold",
                  complete && "border-cardinal bg-cardinal text-gold",
                  active && "border-cardinal text-cardinal ring-4 ring-cardinal/10",
                  !active && !complete && "border-border text-muted-foreground",
                )}>
                  {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                </span>
                <span className={cn("text-xs sm:text-sm", active ? "font-semibold text-ink" : "text-muted-foreground")}>{step}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
