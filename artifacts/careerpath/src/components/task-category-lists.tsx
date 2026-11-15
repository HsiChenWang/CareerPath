import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { TASK_LIST_CATEGORIES, taskListCategory, type TaskListCategory } from "@/lib/cp";

type CategorizedTask = { id: string; category: string };

const CATEGORY_STYLES: Record<TaskListCategory, { card: string; header: string; count: string; icon: string }> = {
  Courses: {
    card: "border-l-4 border-l-amber-400",
    header: "bg-gradient-to-r from-amber-100/90 to-amber-50/40 dark:from-amber-950/55 dark:to-amber-950/10",
    count: "text-amber-900 dark:text-amber-200",
    icon: "text-amber-800 dark:text-amber-300",
  },
  "Club Experiences": {
    card: "border-l-4 border-l-rose-500",
    header: "bg-gradient-to-r from-rose-100/90 to-rose-50/40 dark:from-rose-950/55 dark:to-rose-950/10",
    count: "text-rose-900 dark:text-rose-200",
    icon: "text-rose-800 dark:text-rose-300",
  },
  Internships: {
    card: "border-l-4 border-l-sky-500",
    header: "bg-gradient-to-r from-sky-100/90 to-sky-50/40 dark:from-sky-950/55 dark:to-sky-950/10",
    count: "text-sky-900 dark:text-sky-200",
    icon: "text-sky-800 dark:text-sky-300",
  },
  "Case Competitions": {
    card: "border-l-4 border-l-orange-500",
    header: "bg-gradient-to-r from-orange-100/90 to-orange-50/40 dark:from-orange-950/55 dark:to-orange-950/10",
    count: "text-orange-900 dark:text-orange-200",
    icon: "text-orange-800 dark:text-orange-300",
  },
  Certificates: {
    card: "border-l-4 border-l-violet-500",
    header: "bg-gradient-to-r from-violet-100/90 to-violet-50/40 dark:from-violet-950/55 dark:to-violet-950/10",
    count: "text-violet-900 dark:text-violet-200",
    icon: "text-violet-800 dark:text-violet-300",
  },
};

export function TaskCategoryLists<T extends CategorizedTask>({
  tasks,
  renderTask,
}: {
  tasks: T[];
  renderTask: (task: T) => ReactNode;
}) {
  const [expanded, setExpanded] = useState<Set<TaskListCategory>>(() => new Set(["Courses"]));

  const toggle = (category: TaskListCategory) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {TASK_LIST_CATEGORIES.map((category) => {
        const items = tasks.filter((task) => taskListCategory(task) === category);
        if (!items.length) return null;
        const isExpanded = expanded.has(category);
        const slug = category.toLowerCase().replaceAll(" ", "-");
        const panelId = `task-category-panel-${slug}`;
        const style = CATEGORY_STYLES[category];

        return (
          <section key={category} className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md ${style.card}`} aria-label={category} data-testid={`task-list-${slug}`}>
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={() => toggle(category)}
              className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:saturate-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cardinal ${style.header}`}
              data-testid={`button-toggle-category-${slug}`}
            >
              <span>
                <span className="block font-display text-xl">{category}</span>
                <span className={`mt-0.5 block font-mono text-[11px] uppercase tracking-wider ${style.count}`}>
                  {items.length} task{items.length === 1 ? "" : "s"}
                </span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${style.icon} ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <div id={panelId} hidden={!isExpanded} className="space-y-3 border-t bg-background/75 p-3">
              {items.map(renderTask)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
