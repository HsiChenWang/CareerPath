import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { TASK_LIST_CATEGORIES, taskListCategory, type TaskListCategory } from "@/lib/cp";

type CategorizedTask = { id: string; category: string };

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

        return (
          <section key={category} className="overflow-hidden rounded-2xl border bg-card" aria-label={category} data-testid={`task-list-${slug}`}>
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={() => toggle(category)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
              data-testid={`button-toggle-category-${slug}`}
            >
              <span>
                <span className="block font-display text-xl">{category}</span>
                <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {items.length} task{items.length === 1 ? "" : "s"}
                </span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-cardinal transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <div id={panelId} hidden={!isExpanded} className="space-y-3 border-t p-3">
              {items.map(renderTask)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
