import "./_group.css";
import { ArrowUpRight, CalendarDays, Check, Sparkles } from "lucide-react";

const categoryStyles: Record<string, string> = {
  Courses: "border-amber-300 bg-amber-100 text-amber-950",
  "Club Experiences": "border-rose-200 bg-rose-100 text-rose-950",
  Internships: "border-sky-200 bg-sky-100 text-sky-950",
  "Case Competitions": "border-orange-200 bg-orange-100 text-orange-950",
  Certificates: "border-violet-200 bg-violet-100 text-violet-950",
};

const terms = [
  {
    label: "Second semester, Junior year",
    focus: "Build your foundation",
    wash: "from-[#fff1bf] to-[#fffdf5]",
    border: "border-[#dfb83c]",
    marker: "bg-[#ffcc00] text-[#3c2c00]",
    line: "bg-[#d4a900]",
    tasks: [
      { title: "Complete a finance or analytics course", category: "Courses", description: "Build the fundamentals used in entry-level business roles." },
      { title: "Join a relevant student organization", category: "Club Experiences", description: "Find a team where you can contribute to real projects." },
      { title: "Earn an Excel modeling certificate", category: "Certificates", description: "Practice the tools that show up in internship interviews." },
    ],
  },
  {
    label: "First semester, Senior year",
    focus: "Show what you can do",
    wash: "from-[#fae1e5] to-[#fff8f7]",
    border: "border-[#c7697c]",
    marker: "bg-[#9a1230] text-white",
    line: "bg-[#9a1230]",
    tasks: [
      { title: "Apply to summer internships", category: "Internships", description: "Target roles that match your coursework and project experience." },
      { title: "Enter a student case competition", category: "Case Competitions", description: "Work through a business problem with a cross-functional team." },
      { title: "Create a portfolio project", category: "Club Experiences", description: "Show the question, analysis, and result in one concise case study." },
    ],
  },
  {
    label: "Second semester, Senior year",
    focus: "Launch your next chapter",
    wash: "from-[#dff0ed] to-[#f8fcfa]",
    border: "border-[#6b9e96]",
    marker: "bg-[#23695f] text-white",
    line: "bg-[#23695f]",
    tasks: [
      { title: "Present your internship impact", category: "Internships", description: "Document the work, measurable result, and lessons learned." },
      { title: "Start a full-time job search", category: "Internships", description: "Build a focused shortlist and tailor your application materials." },
      { title: "Ask an alum for a career conversation", category: "Club Experiences", description: "Use a specific question to learn about a role or team." },
    ],
  },
];

export function RicherColor() {
  return (
    <main className="min-h-screen bg-[#f5f0e8] p-4 text-[#2a1418] md:p-6">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[1.8rem] border border-[#6e0000]/20 bg-white shadow-[0_24px_70px_-32px_rgba(69,0,18,0.55)]">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#6e0000] via-[#990000] to-[#3b0013] px-5 py-6 text-white md:px-7 md:py-7">
          <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-[#ffcc00]/15" />
          <div aria-hidden="true" className="absolute bottom-0 right-24 h-20 w-20 rotate-45 border border-white/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffdc61]">
                <CalendarDays className="h-4 w-4" /> CareerPath roadmap
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">Your next chapters</h2>
              <p className="mt-2 text-sm text-white/75">A semester plan built around your profile and today’s date.</p>
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#ffdc61]">Starting point</p>
              <p className="mt-1 font-semibold">Junior <span className="text-white/50">·</span> First semester</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/65"><Sparkles className="h-3 w-3 text-[#ffdc61]" />Set automatically</span>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 md:px-7 md:py-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8c2736]">Your roadmap</p>
              <h3 className="mt-1 font-display text-2xl">Plan by semester</h3>
            </div>
            <p className="rounded-full bg-[#f8eee0] px-3 py-1.5 text-xs font-medium text-[#6b3a18]">3 semesters ahead</p>
          </div>

          <div className="space-y-4">
            {terms.map((term, index) => (
              <section key={term.label} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${term.wash} ${term.border} p-4 shadow-sm transition-shadow hover:shadow-md md:p-5`}>
                <div className={`absolute bottom-7 left-[1.45rem] top-[5.2rem] w-0.5 ${term.line}/45`} aria-hidden="true" />
                <div className="relative flex items-start gap-3">
                  <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-4 ring-white/70 ${term.marker}`}>{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6f5550]">{term.focus}</p>
                        <h4 className="font-display text-lg leading-tight md:text-xl">{term.label}</h4>
                      </div>
                      <span className="rounded-full border border-white/75 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#61454b]">Term {index + 1}</span>
                    </div>
                    <ol className="mt-4 space-y-2.5">
                      {term.tasks.map((task) => (
                        <li key={task.title} className="relative rounded-xl border border-white/80 bg-white/75 p-3 shadow-[0_4px_14px_-12px_rgba(42,20,24,0.6)] backdrop-blur-sm">
                          <span className={`absolute -left-[1.58rem] top-4 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${term.line}`} aria-hidden="true"><Check className="h-2.5 w-2.5 text-white" /></span>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold leading-snug">{task.title}</p>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryStyles[task.category]}`}>{task.category}</span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-[#66585a]">{task.description}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f4eee8] px-4 py-3 text-sm text-[#66585a]">
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#990000]" />
            <p>Completed tasks leave the timeline but stay checked in their category list.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
