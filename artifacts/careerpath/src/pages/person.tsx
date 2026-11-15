import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, CalendarClock, Check, Linkedin, Mail, Phone, ShieldCheck } from "lucide-react";
import { useGetPerson, getGetPersonQueryKey } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { ErrorBlock, PersonAvatar, Tag, AiThinking } from "@/components/bits";
import { useCoach } from "@/components/coach";
import { SafetyMenu } from "@/components/safety";
import { PersonActions } from "@/pages/connect";
import { Skeleton } from "@/components/ui/skeleton";
import { errMsg, fmtTime, roleLine, useMe } from "@/lib/cp";

function linkedInHref(value?: string) {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol) || !(url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com"))) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function emailHref(value?: string) {
  const email = value?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : undefined;
}

function phoneHref(value?: string) {
  const phone = value?.trim();
  if (!phone || phone.replace(/\D/g, "").length < 5) return undefined;
  const number = phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return number ? `tel:${number}` : undefined;
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  const uniqueItems = [...new Set(items)];
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">{uniqueItems.map((t) => <Tag key={`${title}-${t}`}>{t}</Tag>)}</div>
    </div>
  );
}

export default function PersonPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useMe();
  const { setFocus } = useCoach();
  const q = useGetPerson(id, { query: { enabled: !!id, queryKey: getGetPersonQueryKey(id) } });
  const p = q.data;
  const timelineSteps = p?.timeline ?? [];
  const linkedin = linkedInHref(p?.linkedin);
  const email = emailHref(p?.contactEmail);
  const phone = phoneHref(p?.phone);

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
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.38fr)] lg:gap-7">
          <div className="space-y-6">
            <section className="rise rounded-[1.75rem] border border-border/80 bg-card shadow-sm">
              <div className="px-5 pb-5 pt-5 md:px-6">
                <div className="flex items-start justify-between">
                  <PersonAvatar person={p} size={88} className="border-4 border-card shadow-sm" />
                  {user?.id !== p.id && <SafetyMenu personId={p.id} name={p.name} />}
                </div>
                <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cardinal">{p.role === "alumni" ? "Alumni profile" : "Student profile"}</p>
                    <h1 className="mt-1 font-display text-3xl leading-tight" data-testid="text-person-name">{p.name}</h1>
                    <p className="mt-1 text-muted-foreground" data-testid="text-person-role">{roleLine(p)}</p>
                  </div>
                  {p.role === "alumni" && p.openToChat && !p.paused && <Tag tone="gold">Open to coffee chats</Tag>}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Tag tone="cardinal">{p.school}{p.gradYear ? ` '${String(p.gradYear).slice(-2)}` : ""}</Tag>
                  {p.major && <Tag>{p.major}</Tag>}
                  {p.level && <Tag>{p.level}</Tag>}
                  {p.paused && <Tag>Requests paused</Tag>}
                </div>
                {p.bio && <p className="mt-4 text-sm leading-relaxed text-foreground/75">{p.bio}</p>}
                {(linkedin || email || phone) && (
                  <nav className="mt-4 flex flex-wrap gap-2" aria-label="Contact options" data-testid="list-profile-contact">
                    {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-muted" data-testid="link-contact-linkedin"><Linkedin className="h-4 w-4 text-cardinal" aria-hidden />LinkedIn</a>}
                    {email && <a href={email} className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-muted" data-testid="link-contact-email"><Mail className="h-4 w-4 text-cardinal" aria-hidden />Email</a>}
                    {phone && <a href={phone} className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-muted" data-testid="link-contact-phone"><Phone className="h-4 w-4 text-cardinal" aria-hidden />Phone</a>}
                  </nav>
                )}
                {user?.role === "student" && user.id !== p.id && <div className="mt-5"><PersonActions person={p} /></div>}
              </div>
            </section>
            {p.fitReason && (
              <section className="rounded-[1.5rem] border border-gold/60 bg-gold-soft/75 p-5 md:p-6">
                <div className="flex items-center gap-2 text-cardinal">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold"><ShieldCheck className="h-4 w-4" /></span>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em]">What you share</p>
                </div>
                <p className="mt-3 font-display text-lg leading-snug text-ink" data-testid="text-person-fit">{p.fitReason}</p>
              </section>
            )}
            <section className="rounded-[1.5rem] border border-border/80 bg-card p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-xl">Conversation starters</h2>
                <CalendarClock className="h-4 w-4 text-cardinal" />
              </div>
              <div className="space-y-5">
                <Section title="Happy to help with" items={p.helpTopics} />
                <Section title="Clubs" items={p.clubs} />
                <Section title="Skills" items={p.skills} />
                <Section title="Courses" items={p.courses} />
                <Section title="Interests" items={p.interests} />
              </div>
              {!!p.availability?.length && (
                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Availability</p>
                  <ul className="space-y-1.5">{p.availability.slice(0, 6).map((a) => <li key={a} className="flex items-center gap-2 text-sm"><CalendarClock className="h-3.5 w-3.5 text-cardinal" />{fmtTime(a)}</li>)}</ul>
                </div>
              )}
            </section>
          </div>
          <section className="rise rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm md:p-8" style={{ animationDelay: "100ms" }}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cardinal">Career journey</p>
                <h2 className="mt-1 font-display text-3xl">How {p.name.split(" ")[0]} got here</h2>
              </div>
              <p className="rounded-full bg-muted px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{timelineSteps.length} milestones</p>
            </div>
            {timelineSteps.length ? (
              <ol className="relative space-y-1">
                <span className="absolute bottom-4 left-[17px] top-4 w-px bg-border" aria-hidden />
                {timelineSteps.map((step, index) => (
                  <li key={`${step.year}-${index}`} className="relative grid grid-cols-[38px_1fr] gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-muted/50" data-testid={`timeline-step-${index}`}>
                    <span className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border border-cardinal/15 bg-card text-[10px] font-semibold text-cardinal ${step.year === "Now" ? "bg-cardinal text-white" : ""}`}>
                      {step.year === "Now" ? <Check className="h-4 w-4" /> : step.year}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="font-semibold leading-snug">{step.title}</h3>
                      {step.detail && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-2xl bg-muted/60 p-5 text-sm text-muted-foreground">No career journey shared yet.</p>
            )}
            <div className="mt-5 border-t border-border/70 pt-5">
              <Section title="Experience" items={p.experience} />
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
