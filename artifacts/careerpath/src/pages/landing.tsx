import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Compass, Map, Target, Users, MessageCircle, RefreshCw, ShieldCheck, Coffee } from "lucide-react";
import { useDemoLogin, getGetSessionQueryKey } from "@workspace/api-client-react";
import { Logo } from "@/components/shell";
import { useToast } from "@/hooks/use-toast";
import { errMsg, homeFor, useMe, PATH_KEY } from "@/lib/cp";

const STEPS = [
  { n: "01", icon: Compass, t: "Explore", d: "Undecided is a starting point. Meet Trojans who sat in your seat, then went six different directions." },
  { n: "02", icon: Map, t: "Path Finder", d: "Pick a dream role. See the common path, year by year, and how many alumni actually took each step." },
  { n: "03", icon: Target, t: "My Gap", d: "Your profile against that path. What you have done, what is next, and three moves for this semester." },
  { n: "04", icon: Users, t: "Connect", d: "Alumni ranked by real overlap: same club, same major, same first internship. Peers chasing the same goal." },
  { n: "05", icon: MessageCircle, t: "Network", d: "AI drafts that cite what you actually share. Coffee chats with prep briefs and notes that turn into action." },
  { n: "06", icon: RefreshCw, t: "Follow up", d: "Thank-yous, check-ins and milestone updates, drafted and on time. Connections become relationships." },
];

const PLATFORMS = ["Trojan Network", "Viterbi Link", "Rossier Career Network", "Marshall Connect", "Handshake", "LinkedIn", "Club Slack", "That one group chat"];

export default function Landing() {
  const { user } = useMe();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const demo = useDemoLogin();

  const tryDemo = (role: "student" | "alumni") => {
    if (user) return setLocation(homeFor(user));
    demo.mutate({ data: { role } }, {
      onSuccess: (s) => {
        sessionStorage.removeItem(PATH_KEY);
        qc.clear();
        qc.setQueryData(getGetSessionQueryKey(), s);
        setLocation(homeFor(s.user));
      },
      onError: (e) => toast({ title: "Demo is waking up", description: errMsg(e), variant: "destructive" }),
    });
  };

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-12">
          <Logo />
          <div className="flex items-center gap-2">
            {user ? (
              <Link href={homeFor(user)} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper" data-testid="link-open-app">Open CareerPath</Link>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-medium hover:bg-muted" data-testid="link-login">Log in</Link>
                <Link href="/register" className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper sm:block" data-testid="link-register-top">Get started</Link>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-8 md:px-12 lg:grid-cols-2 lg:gap-16 lg:pb-4 lg:pt-8">
          <div className="relative z-10">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-cardinal/15 bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-cardinal">
              <span className="h-2 w-2 rounded-full bg-gold" /> An AI career companion for USC
            </p>
            <h1 className="rise mt-6 font-display text-[3.2rem] font-semibold leading-[0.95] tracking-tight text-ink sm:text-7xl lg:text-6xl xl:text-7xl" style={{ animationDelay: "80ms" }} data-testid="text-headline">
              See how Trojans got there.{" "}
              <span className="relative inline-block text-cardinal">
                Find your path.
                <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 10 C 60 2, 120 16, 180 8 S 270 4, 298 9" stroke="#FFCC00" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="rise mt-8 max-w-xl text-lg text-foreground/70 md:text-xl" style={{ animationDelay: "160ms" }}>
              Discover careers, see the steps alumni took, and build real connections with the Trojans who can help.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <Link href={user ? homeFor(user) : "/register"} className="group inline-flex items-center gap-2 rounded-full bg-cardinal px-7 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95" data-testid="button-get-started">
                Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button onClick={() => tryDemo("student")} disabled={demo.isPending} className="inline-flex items-center gap-2 rounded-full border-2 border-ink/80 bg-gold px-7 py-[14px] text-base font-semibold text-ink transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60" data-testid="button-try-demo">
                {demo.isPending ? "Opening Alex's account..." : "Try demo"}
              </button>
            </div>
            <p className="rise mt-5 text-sm text-muted-foreground" style={{ animationDelay: "300ms" }}>
              Demo signs you in as Alex Kim, an undecided CS sophomore.{" "}
              <button onClick={() => tryDemo("alumni")} className="font-medium text-cardinal underline-offset-4 hover:underline" data-testid="button-try-demo-alum">Or see the alum side as Priya.</button>
            </p>
          </div>

          <div className="rise relative w-full lg:max-w-[400px] xl:max-w-none" style={{ animationDelay: "200ms" }}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-2xl sm:aspect-[5/5] lg:aspect-[4/5]">
              <img src={`${import.meta.env.BASE_URL}hero-path.jpg`} alt="A golden path winding across campus" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-cardinal-deep/70 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* SCATTERED */}
      <section className="border-y border-cardinal-deep bg-cardinal py-6 text-white">
        <div className="flex overflow-hidden">
          <div className="marquee flex shrink-0 items-center gap-10 pr-10">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl text-white/85">
                {p} <span className="h-2 w-2 rounded-full bg-gold" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">
            The Trojan network is huge. <span className="text-cardinal">It is also in eight places</span>, and none of them show you how anyone got anywhere.
          </h2>
          <div className="space-y-5 text-lg text-foreground/75">
            <p>A profile says "Product Manager, Google." It does not say she was a CS sophomore who could not decide either, joined the same hackathon club you did, and took a scrappy startup internship before the big one.</p>
            <p>CareerPath reads thousands of those years so you can see the pattern, then helps you reach the people behind it with messages that sound like you on a good day.</p>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-card py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cardinal">Six steps, AI at every one</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl md:text-5xl">From "no idea" to "coffee on Thursday."</h2>
          <div className="relative mt-16">
            <span className="trail-h absolute left-0 right-0 top-7 hidden h-1 lg:block" />
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map(({ n, icon: Icon, t, d }, i) => (
                <div key={n} className="lift relative rounded-3xl border bg-paper p-7" data-testid={`card-step-${i}`}>
                  <div className="flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cardinal text-gold"><Icon className="h-6 w-6" /></span>
                    <span className="font-display text-5xl text-cardinal/15">{n}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl">{t}</h3>
                  <p className="mt-2 text-foreground/70">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PATH SAMPLE */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cardinal">Path Finder, real output</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Product Manager at Google. Based on 9 Trojans.</h2>
            <p className="mt-5 text-lg text-foreground/70">Not a generic roadmap. A count of what alumni actually did, and when they did it. Then My Gap holds it against your profile and hands you three moves for this semester.</p>
          </div>
          <div className="rounded-[2rem] border bg-card p-6 shadow-lg md:p-8">
            {[
              ["Freshman", "Joined a build club (Hack SC, LavaLab)", 7],
              ["Sophomore", "Shipped a side project with users", 6],
              ["Junior", "Summer internship, SWE or APM", 6],
              ["Senior", "Return offer or APM program", 5],
              ["Now", "Product Manager, Google", 9],
            ].map(([stage, title, c], i) => (
              <div key={i} className="relative flex gap-5 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="h-4 w-4 rounded-full border-[3px] border-cardinal bg-card" />
                  {i < 4 && <span className="trail mt-1 w-1 flex-1" />}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-cardinal">{stage}</p>
                  <p className="font-semibold">{title}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="grow h-full rounded-full bg-gold" style={{ width: `${(Number(c) / 9) * 100}%`, animationDelay: `${i * 120}ms` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{c} of 9</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTH SIDES */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink p-10 text-paper">
          <Coffee className="absolute -bottom-6 -right-6 h-40 w-40 text-white/5" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">For alumni</p>
          <h3 className="mt-3 font-display text-3xl md:text-4xl">Give back on your terms.</h3>
          <p className="mt-4 max-w-md text-paper/70">Set topics, weekly slots and a monthly cap. Pause anytime. Before you reply, AI tells you who is asking: "Sophomore in Viterbi, in your old hackathon club, wants to become a PM."</p>
          <button onClick={() => tryDemo("alumni")} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5" data-testid="button-alum-demo">
            See Priya's requests <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-[2rem] border bg-card p-10">
          <ShieldCheck className="h-8 w-8 text-cardinal" />
          <h3 className="mt-4 font-display text-3xl">Respect is built in.</h3>
          <ul className="mt-5 space-y-3 text-foreground/75">
            {["No emails or phone numbers, ever.", "One first message per alum until they reply.", "Five new conversations a day, one nudge max.", "Report or block from any profile or chat."].map((s) => (
              <li key={s} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold ring-2 ring-cardinal/20" />{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-cardinal">
        <div className="trail-h absolute left-0 right-0 top-0 h-1" />
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-24 md:flex-row md:items-end md:justify-between md:px-8">
          <h2 className="max-w-3xl font-display text-5xl leading-[0.95] text-white md:text-7xl">
            Somebody already walked your path. <span className="text-gold">Go say hi.</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href={user ? homeFor(user) : "/register"} className="rounded-full bg-gold px-7 py-4 font-semibold text-ink transition-transform hover:-translate-y-0.5" data-testid="button-cta-start">Get started</Link>
            <button onClick={() => tryDemo("student")} className="rounded-full border-2 border-white/40 px-7 py-[14px] font-semibold text-white transition-colors hover:bg-white/10" data-testid="button-cta-demo">Try demo</button>
          </div>
        </div>
      </section>
    </div>
  );
}
