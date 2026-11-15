import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Map, Search } from "lucide-react";
import { useFindPath, useGetGap, useUpdateGapStep, getGetGapQueryKey, getGetNetworkQueryKey, getGetSessionQueryKey } from "@workspace/api-client-react";
import type { CareerPath } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { CareerWorkflowProgress } from "@/components/career-workflow";
import { AiThinking, EmptyBlock, ErrorBlock, PageHeader, PersonAvatar, Tag } from "@/components/bits";
import { useCoach } from "@/components/coach";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { alumniRateLabel, errMsg, isOptionalTask, percentOfRelatedAlumni, TASK_LIST_CATEGORIES, taskListCategory, useMe, PATH_KEY } from "@/lib/cp";

const PATH_CACHE_VERSION = 3;
function loadStored(): CareerPath | null {
  try {
    const raw = sessionStorage.getItem(PATH_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { version?: number; path?: CareerPath };
    return cached.version === PATH_CACHE_VERSION ? cached.path ?? null : null;
  } catch {
    return null;
  }
}

export default function PathFinder() {
  const { user } = useMe();
  const search = useSearch();
  const qc = useQueryClient();
  const { setFocus } = useCoach();
  const params = new URLSearchParams(search);
  const requestedRole = params.get("role");
  const requestedCompany = params.get("company") || "";
  const [role, setRole] = useState(params.get("role") || user?.dreamRole || "");
  const [company, setCompany] = useState(params.get("company") || user?.dreamCompany || "");
  const [path, setPath] = useState<CareerPath | null>(() => (params.get("role") ? null : loadStored()));
  const find = useFindPath();
  const gapQuery = useGetGap({ query: { enabled: !!path, queryKey: getGetGapQueryKey(), refetchOnMount: "always" } });
  const updateStep = useUpdateGapStep();
  const { toast } = useToast();
  const findRef = useRef(find.mutate);
  findRef.current = find.mutate;
  const ran = useRef(false);

  const run = (r: string, c: string) => {
    if (!r.trim()) return;
    findRef.current({ data: { role: r.trim(), company: c.trim() || undefined } }, {
      onSuccess: (p) => {
        setPath(p);
        sessionStorage.setItem(PATH_KEY, JSON.stringify({ version: PATH_CACHE_VERSION, path: p }));
        qc.invalidateQueries({ queryKey: getGetSessionQueryKey() });
        qc.invalidateQueries({ queryKey: getGetGapQueryKey() });
      },
    });
  };

  useEffect(() => {
    if (ran.current) return;
    const initialRole = requestedRole || (!path ? user?.dreamRole : undefined);
    if (initialRole) {
      ran.current = true;
      run(initialRole, requestedRole ? requestedCompany : user?.dreamCompany || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedRole, requestedCompany, path, user?.dreamRole, user?.dreamCompany]);

  useEffect(() => {
    setFocus({ goal: path ? `${path.role}${path.company ? ` at ${path.company}` : ""}` : undefined, label: path ? `the path to ${path.role}` : undefined });
    return () => setFocus({});
  }, [path, setFocus]);

  const submit = (e: FormEvent) => { e.preventDefault(); run(role, company); };
  const toggleStep = (id: string, done: boolean) => updateStep.mutate({ id, data: { done } }, {
    onSuccess: (gap) => {
      qc.setQueryData(getGetGapQueryKey(), gap);
      qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
    },
    onError: (error) => toast({ title: "Could not update this track", description: errMsg(error), variant: "destructive" }),
  });
  const gap = gapQuery.data;
  const matchedTasks = gap?.steps.filter((step) => step.category !== "advice" && !isOptionalTask(step) && step.done).length ?? 0;
  const taskLists = TASK_LIST_CATEGORIES.map((category) => ({
    category,
    steps: path?.steps.filter((step) => taskListCategory(step) === category) ?? [],
  }));

  return (
    <Page>
      <CareerWorkflowProgress current="start" showStartChoiceLink />
      <PageHeader eyebrow="Path Finder" title={<>Where do you <span className="text-cardinal">want to end up?</span></>} sub="Name a dream role. We read the year-by-year timelines of Trojans who got there and find the common path." />

      <form onSubmit={submit} className="rise mb-12 flex flex-col gap-3 rounded-[1.75rem] border bg-card p-3 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 text-cardinal" /><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Dream role, e.g. Product Manager" className="h-12 border-0 bg-transparent text-lg shadow-none focus-visible:ring-0" data-testid="input-dream-role" /></div>
        <div className="hidden h-8 w-px bg-border md:block" />
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="h-12 border-0 bg-muted/50 px-4 text-lg shadow-none focus-visible:ring-0 md:w-56 md:bg-transparent" data-testid="input-dream-company" />
        <button disabled={!role.trim() || find.isPending} className="h-12 rounded-2xl bg-cardinal px-7 font-semibold text-white transition-transform active:scale-95 disabled:opacity-50" data-testid="button-find-path">{find.isPending ? "Mapping..." : "Map the path"}</button>
      </form>

      {find.isPending ? (
        <div className="space-y-4"><AiThinking label="Mapping the path across alumni timelines..." className="max-w-md" />{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted" />)}</div>
      ) : find.isError && !path ? (
        <ErrorBlock message={errMsg(find.error)} onRetry={() => run(role, company)} />
      ) : !path ? (
        <EmptyBlock icon={<Map className="h-6 w-6" />} title="No path mapped yet" body="Try Product Manager at Google, Investment Banking Analyst at Goldman Sachs, or Software Engineer at Apple. Not sure? Explore first." action={<Link href="/explore" className="rounded-full border border-cardinal px-5 py-2.5 text-sm font-semibold text-cardinal" data-testid="link-go-explore">Explore careers</Link>} />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="rise rounded-[1.75rem] bg-cardinal p-7 text-white md:p-9">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold" data-testid="text-based-on">Based on {path.total} related alumni</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl" data-testid="text-path-title">{path.role}{path.company ? ` at ${path.company}` : ""}</h2>
              <p className="mt-4 text-white/85 md:text-lg" data-testid="text-path-summary">{path.summary}</p>
              {path.total < 5 && <p className="mt-3 text-xs text-white/70">The related-alumni sample is small, so step percentages are hidden rather than overstated.</p>}
              {path.fallback && <p className="mt-3 text-xs text-white/60">Built from pattern counts while the AI rests. The numbers are real.</p>}
            </div>
            <section className="mt-8" aria-labelledby="task-list-title">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cardinal">Level 2 roadmap</p>
                  <h3 id="task-list-title" className="mt-1 font-display text-2xl">Task lists</h3>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">Each stage is broken into concrete actions. Compare them with your saved profile; resume details count after you import and save them in Profile.</p>
                </div>
                {gap && <p className="text-xs font-medium text-muted-foreground" data-testid="text-profile-task-match">{matchedTasks} task{matchedTasks === 1 ? "" : "s"} matched</p>}
              </div>
              {gapQuery.isError && <ErrorBlock message={`Profile comparison unavailable: ${errMsg(gapQuery.error)}`} onRetry={() => gapQuery.refetch()} />}
              {gapQuery.isLoading && <AiThinking label="Comparing these tasks with your saved profile..." className="mb-4 max-w-md" />}
              {path.steps.length === 0 ? (
                <p className="mt-6 text-muted-foreground">No matching alumni timelines yet. Try a broader role name.</p>
              ) : (
                <div className="space-y-6">
                  {taskLists.map(({ category, steps }) => steps.length > 0 && (
                    <section key={category} aria-label={category} data-testid={`task-list-${category.toLowerCase().replaceAll(" ", "-")}`}>
                      <div className="mb-3 flex items-center justify-between border-b pb-2">
                        <h4 className="font-display text-xl">{category}</h4>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{steps.length} task{steps.length === 1 ? "" : "s"}</span>
                      </div>
                      <ol className="space-y-3">
                        {steps.map((step, index) => {
                          const profileStep = gap?.steps.find((item) => item.id === step.id);
                          const done = !!profileStep?.done;
                          const rate = percentOfRelatedAlumni(step.count, step.total);
                          return (
                            <li key={step.id} className="rise" style={{ animationDelay: `${index * 70}ms` }} data-testid={`task-${step.id}`}>
                        <button
                          type="button"
                          onClick={() => profileStep && toggleStep(profileStep.id, !done)}
                          disabled={!profileStep || gapQuery.isError || updateStep.isPending}
                          aria-pressed={done}
                          aria-label={`${done ? "Mark not done" : "Mark done"}: ${step.title}`}
                          className="group flex w-full items-start gap-4 rounded-3xl border bg-card p-5 text-left transition-all hover:border-cardinal/35 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-80"
                          data-testid={`button-task-${step.id}`}
                        >
                          <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 ${done ? "border-cardinal bg-cardinal text-gold" : "border-input group-hover:border-cardinal"}`}>
                            {done && <Check className="h-4 w-4" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] uppercase tracking-wider text-cardinal">{step.stage}</span>
                              {profileStep && <Tag tone={done ? "gold" : "muted"}>{done ? "Already done" : "Suggested"}</Tag>}
                              {isOptionalTask(step) && <Tag tone="muted">Optional</Tag>}
                            </span>
                            <span className="mt-1 block text-lg font-semibold">{step.title}</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {gapQuery.isError ? "Profile comparison unavailable." : profileStep?.description ?? (gapQuery.isLoading ? "Checking your saved profile…" : "Not found in your saved profile yet.")}
                            </span>
                            {profileStep && <span className="mt-1 block text-xs text-muted-foreground">{done ? "Found in your saved profile or confirmed by you." : "Suggested to build toward this goal."}</span>}
                            {step.total >= 5 ? (
                              <span className="mt-4 flex items-center gap-3">
                                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <span className="block h-full rounded-full bg-gold transition-all" style={{ width: `${rate}%` }} />
                                </span>
                                <span className="whitespace-nowrap font-mono text-xs font-semibold" data-testid={`text-alumni-rate-${step.id}`}>{alumniRateLabel(step.count, step.total)}</span>
                              </span>
                            ) : (
                              <span className="mt-4 block font-mono text-xs font-semibold text-muted-foreground" data-testid={`text-alumni-rate-${step.id}`}>{alumniRateLabel(step.count, step.total)}</span>
                            )}
                          </span>
                        </button>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Link href="/my-gap" className="group block rounded-[1.75rem] bg-gold p-6 text-ink transition-transform hover:-translate-y-1" data-testid="link-see-gap">
              <p className="font-mono text-[11px] uppercase tracking-wider">Next</p>
              <p className="mt-1 font-display text-2xl">See your gap to this path</p>
              <ArrowRight className="mt-4 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            {gap && gap.actions.length > 0 && (
              <div className="rounded-[1.75rem] border bg-card p-6" data-testid="panel-suggested-next-steps">
                <p className="font-mono text-[11px] uppercase tracking-wider text-cardinal">Suggested next steps</p>
                <ol className="mt-3 space-y-3">
                  {gap.actions.slice(0, 3).map((action, index) => (
                    <li key={`${index}-${action}`} className="flex gap-3 text-sm">
                      <span className="font-display text-lg text-cardinal">{index + 1}</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="rounded-[1.75rem] border bg-card p-6" data-testid="panel-resume-comparison">
              <p className="font-display text-xl">Compared with your profile</p>
              <p className="mt-2 text-sm text-muted-foreground">Upload or update your resume in Profile, then save the extracted details to refresh this comparison. The original resume file is not retained.</p>
              <Link href="/profile" className="mt-4 inline-block text-sm font-semibold text-cardinal hover:underline" data-testid="link-update-resume">Update profile or resume</Link>
            </div>
            <div className="rounded-[1.75rem] border bg-card p-6">
              <p className="font-display text-xl">The Trojans behind it</p>
              <div className="mt-4 space-y-3">
                {path.alumni.slice(0, 8).map((a) => (
                  <Link key={a.id} href={`/people/${a.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted" data-testid={`link-path-alum-${a.id}`}>
                    <PersonAvatar person={a} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.currentRole}{a.company ? `, ${a.company}` : ""}</p>
                    </div>
                  </Link>
                ))}
                {!path.alumni.length && <p className="text-sm text-muted-foreground">No alumni matched yet.</p>}
              </div>
            </div>
          </aside>
        </div>
      )}
    </Page>
  );
}
