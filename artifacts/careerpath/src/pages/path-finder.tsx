import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Map, Search } from "lucide-react";
import { useFindPath, getGetGapQueryKey, getGetSessionQueryKey } from "@workspace/api-client-react";
import type { CareerPath } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, EmptyBlock, ErrorBlock, PageHeader, PersonAvatar, Tag } from "@/components/bits";
import { useCoach } from "@/components/coach";
import { Input } from "@/components/ui/input";
import { errMsg, useMe, PATH_KEY } from "@/lib/cp";

function loadStored(): CareerPath | null {
  try {
    const raw = sessionStorage.getItem(PATH_KEY);
    return raw ? (JSON.parse(raw) as CareerPath) : null;
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
  const [role, setRole] = useState(params.get("role") || user?.dreamRole || "");
  const [company, setCompany] = useState(params.get("company") || user?.dreamCompany || "");
  const [path, setPath] = useState<CareerPath | null>(() => (params.get("role") ? null : loadStored()));
  const find = useFindPath();
  const findRef = useRef(find.mutate);
  findRef.current = find.mutate;
  const ran = useRef(false);

  const run = (r: string, c: string) => {
    if (!r.trim()) return;
    findRef.current({ data: { role: r.trim(), company: c.trim() || undefined } }, {
      onSuccess: (p) => {
        setPath(p);
        sessionStorage.setItem(PATH_KEY, JSON.stringify(p));
        qc.invalidateQueries({ queryKey: getGetSessionQueryKey() });
        qc.invalidateQueries({ queryKey: getGetGapQueryKey() });
      },
    });
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const r = params.get("role");
    if (r) run(r, params.get("company") || "");
    else if (!path && user?.dreamRole) run(user.dreamRole, user.dreamCompany || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFocus({ goal: path ? `${path.role}${path.company ? ` at ${path.company}` : ""}` : undefined, label: path ? `the path to ${path.role}` : undefined });
    return () => setFocus({});
  }, [path, setFocus]);

  const submit = (e: FormEvent) => { e.preventDefault(); run(role, company); };

  return (
    <Page>
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
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold" data-testid="text-based-on">Based on {path.total} Trojans</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl" data-testid="text-path-title">{path.role}{path.company ? ` at ${path.company}` : ""}</h2>
              <p className="mt-4 text-white/85 md:text-lg" data-testid="text-path-summary">{path.summary}</p>
              {path.fallback && <p className="mt-3 text-xs text-white/60">Built from pattern counts while the AI rests. The numbers are real.</p>}
            </div>
            {path.steps.length === 0 ? (
              <p className="mt-8 text-muted-foreground">No matching alumni timelines yet. Try a broader role name.</p>
            ) : (
              <ol className="relative mt-10">
                <span className="trail absolute bottom-6 left-[19px] top-6 w-1" />
                {path.steps.map((s, i) => (
                  <li key={s.id} className="rise relative pb-6 pl-14" style={{ animationDelay: `${i * 90}ms` }} data-testid={`step-path-${s.id}`}>
                    <span className="absolute left-0 top-4 grid h-10 w-10 place-items-center rounded-full border-4 border-paper bg-cardinal font-mono text-xs font-semibold text-gold">{i + 1}</span>
                    <div className="rounded-3xl border bg-card p-5 transition-shadow hover:shadow-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-cardinal">{s.stage}</span>
                        <Tag>{s.category}</Tag>
                      </div>
                      <p className="mt-1 text-lg font-semibold">{s.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="grow h-full rounded-full bg-gold" style={{ width: `${s.total ? (s.count / s.total) * 100 : 0}%`, animationDelay: `${200 + i * 90}ms` }} />
                        </div>
                        <span className="whitespace-nowrap font-mono text-xs font-semibold" data-testid={`text-step-count-${s.id}`}>{s.count} of {s.total}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Link href="/my-gap" className="group block rounded-[1.75rem] bg-gold p-6 text-ink transition-transform hover:-translate-y-1" data-testid="link-see-gap">
              <p className="font-mono text-[11px] uppercase tracking-wider">Next</p>
              <p className="mt-1 font-display text-2xl">See your gap to this path</p>
              <ArrowRight className="mt-4 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
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
