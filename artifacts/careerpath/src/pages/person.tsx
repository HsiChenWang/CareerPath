import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { useGetPerson, getGetPersonQueryKey } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { ErrorBlock, PersonAvatar, Tag, Timeline, AiThinking } from "@/components/bits";
import { useCoach } from "@/components/coach";
import { SafetyMenu } from "@/components/safety";
import { PersonActions } from "@/pages/connect";
import { Skeleton } from "@/components/ui/skeleton";
import { errMsg, fmtTime, roleLine, useMe } from "@/lib/cp";

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">{items.map((t) => <Tag key={t}>{t}</Tag>)}</div>
    </div>
  );
}

export default function PersonPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useMe();
  const { setFocus } = useCoach();
  const q = useGetPerson(id, { query: { enabled: !!id, queryKey: getGetPersonQueryKey(id) } });
  const p = q.data;

  useEffect(() => {
    if (p) setFocus({ personId: p.id, label: p.name });
    return () => setFocus({});
  }, [p, setFocus]);

  return (
    <Page>
      <Link href={user?.role === "alumni" ? "/requests" : "/connect"} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cardinal" data-testid="link-back"><ArrowLeft className="h-4 w-4" />Back</Link>
      {q.isLoading ? (
        <div className="space-y-4"><AiThinking label="Pulling up their story..." className="max-w-sm" /><Skeleton className="h-56 rounded-[2rem]" /><Skeleton className="h-96 rounded-[2rem]" /></div>
      ) : q.isError || !p ? (
        <ErrorBlock message={errMsg(q.error, "This profile is unavailable.")} onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <div className="rise overflow-hidden rounded-[2rem] border bg-card">
              <div className="relative h-24 bg-cardinal"><div className="trail-h absolute bottom-3 left-0 right-0 h-1 opacity-70" /></div>
              <div className="-mt-10 px-6 pb-6">
                <div className="flex items-end justify-between">
                  <PersonAvatar person={p} size={84} className="border-4 border-card" />
                  {user?.id !== p.id && <SafetyMenu personId={p.id} name={p.name} />}
                </div>
                <h1 className="mt-4 font-display text-3xl" data-testid="text-person-name">{p.name}</h1>
                <p className="text-muted-foreground" data-testid="text-person-role">{roleLine(p)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag tone="cardinal">{p.school}{p.gradYear ? ` '${String(p.gradYear).slice(-2)}` : ""}</Tag>
                  {p.major && <Tag>{p.major}</Tag>}
                  {p.level && <Tag>{p.level}</Tag>}
                  {p.role === "alumni" && p.openToChat && !p.paused && <Tag tone="gold">Open to coffee chats</Tag>}
                  {p.paused && <Tag>Requests paused</Tag>}
                </div>
                {p.bio && <p className="mt-4 text-sm text-foreground/80">{p.bio}</p>}
                {user?.role === "student" && user.id !== p.id && <div className="mt-5"><PersonActions person={p} /></div>}
              </div>
            </div>
            {p.fitReason && (
              <div className="rounded-[1.75rem] bg-gold p-6 text-ink">
                <p className="font-mono text-[11px] uppercase tracking-wider">What you share</p>
                <p className="mt-2 font-display text-xl leading-snug" data-testid="text-person-fit">{p.fitReason}</p>
              </div>
            )}
            <div className="space-y-5 rounded-[1.75rem] border bg-card p-6">
              <Section title="Happy to help with" items={p.helpTopics} />
              <Section title="Clubs" items={p.clubs} />
              <Section title="Skills" items={p.skills} />
              <Section title="Courses" items={p.courses} />
              <Section title="Interests" items={p.interests} />
              {!!p.availability?.length && (
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Availability</p>
                  <ul className="space-y-1.5">{p.availability.slice(0, 6).map((a) => <li key={a} className="flex items-center gap-2 text-sm"><CalendarClock className="h-3.5 w-3.5 text-cardinal" />{fmtTime(a)}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
          <div className="rise rounded-[2rem] border bg-card p-6 md:p-9" style={{ animationDelay: "100ms" }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cardinal">Year by year</p>
            <h2 className="mb-8 mt-1 font-display text-3xl">How {p.name.split(" ")[0]} got here</h2>
            <Timeline steps={p.timeline} />
            <Section title="Experience" items={p.experience} />
          </div>
        </div>
      )}
    </Page>
  );
}
