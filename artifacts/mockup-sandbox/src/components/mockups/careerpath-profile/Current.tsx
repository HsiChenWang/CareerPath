import "./_group.css";
import { ArrowLeft, CalendarClock, Coffee, MoreHorizontal, PenLine } from "lucide-react";

const profile = {
  name: "Priya Shah",
  role: "Product Manager at Google",
  school: "Viterbi",
  gradYear: "2021",
  major: "Computer Science",
  level: "Undergrad",
  openToChat: true,
  bio: "From late nights at HackSC to building products at Google. Happy to help fellow Trojans find their own path — especially if you're still figuring things out.",
  fitReason: "You both started in HackSC and LavaLab; a shared Computer Science background; Python skills; an interest in Technology. See how that led to Product Manager at Google.",
  clubs: ["HackSC", "LavaLab"],
  skills: ["Python", "SQL", "Product strategy", "User research"],
  courses: ["CSCI 104: Data Structures", "CSCI 201: Software Development", "ITP 466: Business and Data Analytics"],
  interests: ["Product management", "Mentorship", "Technology"],
  helpTopics: ["Career exploration", "Internship advice", "Product Manager interviews"],
  availability: ["Tue, Nov 17 · 10:00 AM", "Fri, Nov 20 · 11:00 AM"],
  timeline: [
    { year: "2017", title: "Started at USC Viterbi", detail: "Began Computer Science; explored CSCI 104: Data Structures." },
    { year: "2018", title: "Joined HackSC", detail: "Built a team project and met collaborators through HackSC." },
    { year: "2019", title: "Undergraduate research", detail: "Research assistant in USC's Information Sciences Institute; applied Python to real problems." },
    { year: "2020", title: "Product internship at Microsoft", detail: "Summer role applying SQL and product strategy; presented work to a cross-functional team." },
    { year: "2021", title: "Graduated, Computer Science", detail: "Completed CSCI 201: Software Development and ITP 466: Business and Data Analytics; mentored younger HackSC members." },
    { year: "2021", title: "Associate Product Manager at Google", detail: "Converted USC alumni conversations into a first full-time opportunity." },
    { year: "2022", title: "Expanded responsibilities", detail: "Led a small initiative, strengthening product strategy and communication." },
    { year: "Now", title: "Product Manager at Google", detail: "Works on product management and supports fellow Trojans." },
  ],
};

function Tag({ children, tone = "muted" }: { children: string; tone?: "muted" | "gold" | "cardinal" }) {
  const toneClass = tone === "gold" ? "bg-gold text-ink" : tone === "cardinal" ? "bg-cardinal/10 text-cardinal" : "bg-muted text-foreground/75";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>{children}</span>;
}

function InitialAvatar({ size = 84 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }} className="grid shrink-0 select-none place-items-center rounded-2xl bg-cardinal font-display font-semibold text-gold">
      PS
    </div>
  );
}

function Timeline() {
  return (
    <ol className="relative">
      <span className="trail absolute bottom-2 left-[7px] top-2 w-1" aria-hidden />
      {profile.timeline.map((step, index) => (
        <li key={`${step.year}-${index}`} className="relative pb-6 pl-8 last:pb-0">
          <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-[3px] border-cardinal bg-card" />
          <p className="font-mono text-[11px] uppercase tracking-wider text-cardinal">{step.year}</p>
          <p className="font-semibold leading-snug">{step.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">{items.map((item) => <Tag key={item}>{item}</Tag>)}</div>
    </div>
  );
}

export function Current() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8">
        <a className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Back</a>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border bg-card">
              <div className="relative h-24 bg-cardinal"><div className="trail-h absolute bottom-3 left-0 right-0 h-1 opacity-70" /></div>
              <div className="-mt-10 px-6 pb-6">
                <div className="flex items-end justify-between">
                  <InitialAvatar />
                  <button className="rounded-full border bg-card p-2 text-muted-foreground" aria-label="Profile options"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                <h1 className="mt-4 font-display text-3xl">{profile.name}</h1>
                <p className="text-muted-foreground">{profile.role}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag tone="cardinal">{`${profile.school} '21`}</Tag>
                  <Tag>{profile.major}</Tag>
                  <Tag>{profile.level}</Tag>
                  <Tag tone="gold">Open to coffee chats</Tag>
                </div>
                <p className="mt-4 text-sm text-foreground/80">{profile.bio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white"><PenLine className="h-3.5 w-3.5" />Draft message</button>
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-cardinal/30 bg-card px-4 py-2 text-sm font-semibold text-cardinal"><Coffee className="h-3.5 w-3.5" />Request coffee chat</button>
                </div>
              </div>
            </section>
            <section className="rounded-[1.75rem] bg-gold p-6 text-ink">
              <p className="font-mono text-[11px] uppercase tracking-wider">What you share</p>
              <p className="mt-2 font-display text-xl leading-snug">{profile.fitReason}</p>
            </section>
            <section className="space-y-5 rounded-[1.75rem] border bg-card p-6">
              <Section title="Happy to help with" items={profile.helpTopics} />
              <Section title="Clubs" items={profile.clubs} />
              <Section title="Skills" items={profile.skills} />
              <Section title="Courses" items={profile.courses} />
              <Section title="Interests" items={profile.interests} />
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Availability</p>
                <ul className="space-y-1.5">{profile.availability.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><CalendarClock className="h-3.5 w-3.5 text-cardinal" />{item}</li>)}</ul>
              </div>
            </section>
          </div>
          <section className="rounded-[2rem] border bg-card p-6 md:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cardinal">Year by year</p>
            <h2 className="mb-8 mt-1 font-display text-3xl">How Priya got here</h2>
            <Timeline />
            <Section title="Experience" items={["USC undergraduate research assistant", "Product internship at Microsoft", "Associate Product Manager at Google"]} />
          </section>
        </div>
      </div>
    </main>
  );
}
