import "./_group.css";
import { ArrowLeft, CalendarClock, Check, Coffee, MoreHorizontal, PenLine, ShieldCheck } from "lucide-react";

const profile = {
  name: "Priya Shah",
  role: "Product Manager",
  company: "Google",
  school: "Viterbi",
  gradYear: "2021",
  major: "Computer Science",
  openToChat: true,
  bio: "From late nights at HackSC to building products at Google. Happy to help fellow Trojans find their own path — especially if you're still figuring things out.",
  fitReason: "You both started in HackSC and LavaLab; share a Computer Science background and Python skills. Her route into product management may offer useful next steps.",
  clubs: ["HackSC", "LavaLab"],
  skills: ["Python", "SQL", "Product strategy", "User research"],
  courses: ["CSCI 104: Data Structures", "CSCI 201: Software Development"],
  interests: ["Product management", "Mentorship", "Technology"],
  experience: ["Undergraduate research at USC", "Product internship at Microsoft", "Associate Product Manager at Google"],
  helpTopics: ["Career exploration", "Internship advice", "PM interviews"],
  timeline: [
    { year: "2017", title: "Started at USC Viterbi", detail: "Began Computer Science and explored data structures." },
    { year: "2018", title: "Joined HackSC", detail: "Built a team project and found collaborators." },
    { year: "2019", title: "Undergraduate research", detail: "Applied Python to real problems at USC's Information Sciences Institute." },
    { year: "2020", title: "Product internship · Microsoft", detail: "Used SQL and product strategy; presented to a cross-functional team." },
    { year: "2021", title: "Graduated in Computer Science", detail: "Completed software development and business analytics coursework." },
    { year: "2021", title: "Associate Product Manager · Google", detail: "Turned alumni conversations into a first full-time opportunity." },
    { year: "2022", title: "Expanded responsibilities", detail: "Led a small initiative and strengthened product strategy." },
    { year: "Now", title: "Product Manager · Google", detail: "Builds products and supports fellow Trojans." },
  ],
};

function Tag({ children, tone = "muted" }: { children: string; tone?: "muted" | "gold" | "cardinal" }) {
  const toneClass = tone === "gold" ? "bg-gold text-ink" : tone === "cardinal" ? "bg-cardinal/10 text-cardinal" : "bg-muted text-foreground/75";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}

function TopicGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">{items.map((item) => <Tag key={item}>{item}</Tag>)}</div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-[1.35rem] border-4 border-card bg-cardinal font-display text-2xl font-semibold text-gold shadow-md">
      PS
    </div>
  );
}

function Journey() {
  return (
    <ol className="relative space-y-1">
      <span className="absolute bottom-4 left-[18px] top-4 w-px bg-border" aria-hidden />
      {profile.timeline.map((step, index) => (
        <li key={`${step.year}-${index}`} className="relative grid grid-cols-[38px_1fr] gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-muted/60">
          <div className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-cardinal/15 bg-card text-[10px] font-semibold text-cardinal">{step.year === "Now" ? <Check className="h-4 w-4" /> : step.year}</div>
          <div className="pt-0.5">
            <h3 className="font-semibold leading-snug">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Refined() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-8 md:pt-8">
        <a className="mb-5 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-cardinal">
          <ArrowLeft className="h-4 w-4" />Back to connections
        </a>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.38fr)]">
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card shadow-sm">
              <div className="relative h-20 overflow-hidden" style={{ background: "linear-gradient(110deg, #6e0000 0%, #990000 62%, #b62d22 100%)" }}>
                <div className="trail-h absolute bottom-0 left-28 right-0 h-1 opacity-80" />
                <div className="absolute -right-8 -top-16 h-40 w-40 rounded-full border border-white/10" />
                <div className="absolute -right-1 -top-10 h-28 w-28 rounded-full border border-white/10" />
              </div>
              <div className="px-5 pb-5 md:px-6">
                <div className="-mt-8 flex items-end justify-between">
                  <Avatar />
                  <button className="mb-1 rounded-full border bg-card p-2 text-muted-foreground transition-colors hover:text-cardinal" aria-label="More profile actions"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cardinal">Alumni profile</p>
                    <h1 className="mt-1 font-display text-3xl leading-tight">{profile.name}</h1>
                    <p className="mt-1 text-base text-muted-foreground">{profile.role} <span className="text-foreground/35">@</span> <span className="font-semibold text-foreground">{profile.company}</span></p>
                  </div>
                  <Tag tone="gold">Open to coffee chats</Tag>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Tag tone="cardinal">{`${profile.school} ’21`}</Tag>
                  <Tag>{profile.major}</Tag>
                  <Tag>Alumni</Tag>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">{profile.bio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-cardinal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cardinal-deep"><PenLine className="h-4 w-4" />Draft message</button>
                  <button className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-cardinal/25 bg-card px-4 py-2.5 text-sm font-semibold text-cardinal transition hover:border-cardinal/50 hover:bg-gold-soft"><Coffee className="h-4 w-4" />Request coffee chat</button>
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-gold/60 bg-gold-soft/75 p-5">
              <div className="flex items-center gap-2 text-cardinal">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gold"><ShieldCheck className="h-4 w-4" /></span>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em]">Your overlap</p>
              </div>
              <p className="mt-3 font-display text-lg leading-snug text-ink">{profile.fitReason}</p>
            </section>

            <section className="rounded-[1.5rem] border border-border/80 bg-card p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-xl">Conversation starters</h2>
                <CalendarClock className="h-4 w-4 text-cardinal" />
              </div>
              <div className="space-y-5">
                <TopicGroup title="Happy to help with" items={profile.helpTopics} />
                <TopicGroup title="Shared clubs" items={profile.clubs} />
                <TopicGroup title="Skills" items={profile.skills} />
                <TopicGroup title="Courses" items={profile.courses} />
                <TopicGroup title="Interests" items={profile.interests} />
              </div>
              <div className="mt-5 border-t pt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Availability</p>
                <div className="flex flex-wrap gap-2">
                  <Tag>Tue · 10:00 AM</Tag>
                  <Tag>Fri · 11:00 AM</Tag>
                </div>
              </div>
            </section>
          </aside>

          <section className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm md:p-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cardinal">Career journey</p>
                <h2 className="mt-1 font-display text-3xl">How Priya got here</h2>
              </div>
              <p className="rounded-full bg-muted px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">2017 — Present</p>
            </div>
            <Journey />
            <div className="mt-5 border-t border-border/70 pt-5">
              <TopicGroup title="Experience" items={profile.experience} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
