import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Target } from "lucide-react";
import { useGetGap, useUpdateGapStep, getGetGapQueryKey, getGetNetworkQueryKey } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { CareerWorkflowProgress } from "@/components/career-workflow";
import { CardSkeletons, EmptyBlock, ErrorBlock, PageHeader, Tag } from "@/components/bits";
import { useCoach } from "@/components/coach";
import { TaskCategoryLists } from "@/components/task-category-lists";
import { TimelinePlan } from "@/components/timeline-plan";
import { useToast } from "@/hooks/use-toast";
import { alumniRateLabel, errMsg, isOptionalTask, useMe } from "@/lib/cp";
import { cn } from "@/lib/utils";

export default function MyGap() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { ask } = useCoach();
  const { user } = useMe();
  const q = useGetGap({ query: { refetchOnMount: "always" } });
  const update = useUpdateGapStep();
  const gap = q.data;

  const toggle = (id: string, done: boolean) =>
    update.mutate({ id, data: { done } }, {
      onSuccess: (g) => { qc.setQueryData(getGetGapQueryKey(), g); qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() }); },
      onError: (e) => toast({ title: "Could not update that step", description: errMsg(e), variant: "destructive" }),
    });

  const pct = gap && gap.total ? gap.completed / gap.total : 0;
  const R = 52, C = 2 * Math.PI * R;

  return (
    <Page>
      <CareerWorkflowProgress current="gap" hasPath={!!gap?.steps.length} />
      <PageHeader eyebrow="My Gap" title={<>Where you are, <span className="text-cardinal">against where they were.</span></>} sub={gap?.role ? `Your profile compared to the common path to ${gap.role}${gap.company ? ` at ${gap.company}` : ""}.` : undefined} />
      {q.isLoading ? <CardSkeletons n={3} /> : q.isError ? <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} /> : !gap || !gap.steps.length ? (
        <EmptyBlock icon={<Target className="h-6 w-6" />} title="Choose a starting point first" body="Explore alumni journeys or find a path to a role, then compare it with your profile here." action={<Link href="/career-workflow" className="rounded-full bg-cardinal px-5 py-2.5 text-sm font-semibold text-white" data-testid="link-career-workflow">Choose how to start</Link>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-6">
            <div className="rise flex items-center gap-6 rounded-[1.75rem] bg-ink p-7 text-paper">
              <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0 -rotate-90">
                <circle cx="64" cy="64" r={R} stroke="rgba(255,255,255,.12)" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r={R} stroke="#FFCC00" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }} />
              </svg>
              <div>
                <p className="font-display text-5xl" data-testid="text-gap-progress">{gap.completed}<span className="text-2xl text-paper/50">/{gap.total}</span></p>
                <p className="mt-1 text-paper/75">You've completed {gap.completed} of {gap.total} core tasks.</p>
                <p className="mt-2 text-xs text-paper/55">Case competitions and certificates are optional and do not count toward core progress.</p>
              </div>
            </div>
            <TimelinePlan
              gap={gap}
              profileYear={user?.year}
              onAsk={(step) => ask(`Help me plan this task for ${step.title}: ${step.description}`)}
            />
          </div>
          <div className="rounded-[1.75rem] border bg-card p-3 md:p-4">
            <TaskCategoryLists
              tasks={gap.steps}
              renderTask={(s) => (
                <button key={s.id} onClick={() => toggle(s.id, !s.done)} disabled={update.isPending} className={cn("group flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-muted/60", s.done && "opacity-80")} data-testid={`checkbox-step-${s.id}`}>
                  <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition-all", s.done ? "border-cardinal bg-cardinal text-gold" : "border-input group-hover:border-cardinal")}>
                    {s.done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-cardinal">{s.stage}</span>
                      <Tag tone={s.done ? "gold" : "muted"}>{s.done ? "Done" : "Not yet"}</Tag>
                      {isOptionalTask(s) && <Tag tone="muted">Optional</Tag>}
                    </div>
                    <p className={cn("mt-1 font-semibold", s.done && "line-through decoration-gold decoration-2")}>{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground" data-testid={`text-alumni-rate-${s.id}`}>
                      {s.category === "advice" ? "Personal advice from a Trojan; not an alumni rate." : alumniRateLabel(s.count, s.total)}
                    </p>
                  </div>
                </button>
              )}
            />
          </div>
        </div>
      )}
    </Page>
  );
}
