import { Link } from "wouter";
import { ArrowRight, Compass } from "lucide-react";
import { useGetPeople } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { CareerWorkflowProgress } from "@/components/career-workflow";
import { AiThinking, CardSkeletons, EmptyBlock, ErrorBlock, PageHeader, PersonAvatar } from "@/components/bits";
import { errMsg, useMe } from "@/lib/cp";

const TINTS = ["bg-cardinal text-white", "bg-gold text-ink", "bg-ink text-paper", "bg-card text-ink", "bg-cardinal-deep text-white", "bg-gold-soft text-ink"];

export default function Explore() {
  const { user } = useMe();
  const q = useGetPeople({ kind: "explore" });
  return (
    <Page>
      <CareerWorkflowProgress current="start" showStartChoiceLink />
      <PageHeader
        eyebrow="Explore"
        title={<>Trojans who started <span className="text-cardinal">where you are.</span></>}
        sub={`Same kind of start${user?.major ? ` (${user.major}${user.school ? `, ${user.school}` : ""})` : ""}. Wildly different finishes. Which one tugs at you?`}
      />
      {q.isLoading ? (
        <div className="space-y-6"><AiThinking label="Finding Trojans like you..." className="max-w-sm" /><CardSkeletons n={6} h={360} /></div>
      ) : q.isError ? (
        <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyBlock icon={<Compass className="h-6 w-6" />} title="Tell us a bit more first" body="Add your major, clubs and interests so we can find alumni who started like you." action={<Link href="/profile" className="rounded-full bg-cardinal px-5 py-2.5 text-sm font-semibold text-white" data-testid="link-complete-profile">Complete profile</Link>} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {q.data.slice(0, 6).map((p, i) => {
            const journey = p.timeline.slice(-4);
            const href = `/path-finder?role=${encodeURIComponent(p.currentRole ?? "")}&company=${encodeURIComponent(p.company ?? "")}`;
            return (
              <article key={p.id} className="lift rise flex flex-col overflow-hidden rounded-[1.75rem] border bg-card" style={{ animationDelay: `${i * 70}ms` }} data-testid={`card-explore-${p.id}`}>
                <div className={`px-6 pb-5 pt-6 ${TINTS[i % TINTS.length]}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-80">Outcome</p>
                  <p className="mt-1 font-display text-2xl leading-tight" data-testid={`text-outcome-${p.id}`}>{p.outcome || p.currentRole}</p>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <Link href={`/people/${p.id}`} className="flex items-center gap-3" data-testid={`link-person-${p.id}`}>
                    <PersonAvatar person={p} size={44} />
                    <div className="min-w-0">
                      <p className="font-semibold hover:text-cardinal">{p.name} <span className="font-normal text-muted-foreground">'{String(p.gradYear ?? "").slice(-2)}</span></p>
                      <p className="truncate text-sm text-muted-foreground">{p.currentRole}{p.company ? `, ${p.company}` : ""}</p>
                    </div>
                  </Link>
                  <p className="mt-2 text-xs text-muted-foreground">{p.major} · {p.school}</p>
                  <ol className="relative mt-5 space-y-2 pl-6">
                    <span className="trail absolute bottom-1 left-[5px] top-1 w-1" />
                    {journey.map((s, j) => (
                      <li key={j} className="relative text-sm">
                        <span className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-cardinal ${j === journey.length - 1 ? "bg-cardinal" : "bg-card"}`} />
                        <span className="font-mono text-[10px] uppercase text-cardinal">{s.year}</span> <span className="text-foreground/85">{s.title}</span>
                      </li>
                    ))}
                  </ol>
                  {p.fitReason && (
                    <div className="mt-5 rounded-2xl bg-gold-soft/70 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-cardinal">Why this might fit you</p>
                      <p className="mt-1 text-sm text-ink" data-testid={`text-fit-${p.id}`}>{p.fitReason}</p>
                    </div>
                  )}
                  <Link href={href} className="group mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-semibold text-cardinal" data-testid={`button-explore-path-${p.id}`}>
                    <span className="rounded-full border border-cardinal/25 px-4 py-2 transition-colors group-hover:bg-cardinal group-hover:text-white">Explore this path</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
