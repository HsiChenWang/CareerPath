import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/shell";
import { homeFor, useMe } from "@/lib/cp";

export default function Landing() {
  const { user } = useMe();

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-paper">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-2 md:px-12">
          <Logo />
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 md:px-12 lg:grid-cols-2 lg:gap-16 lg:pb-4 lg:pt-8">
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
            </div>
            <p className="rise mt-10 max-w-lg font-display text-3xl leading-tight text-ink md:text-4xl" style={{ animationDelay: "320ms" }}>
              Somebody already walked your path. <span className="text-cardinal">Go say hi.</span>
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
    </div>
  );
}
