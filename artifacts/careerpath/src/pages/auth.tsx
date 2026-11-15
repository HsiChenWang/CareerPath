import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, KeyRound } from "lucide-react";
import { useDemoLogin, useLogin, useRegister, getGetSessionQueryKey } from "@workspace/api-client-react";
import type { Session } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shell";
import { errMsg, homeFor, useMe, PATH_KEY } from "@/lib/cp";
import { cn } from "@/lib/utils";

const DEMO = [
  { who: "Alex Kim", what: "Undecided CS sophomore", email: "alex@demo.careerpath.app" },
  { who: "Priya Shah", what: "PM at Google, Viterbi '21", email: "priya@demo.careerpath.app" },
];
const DEMO_PW = "Trojan2026!";
const FEATURED_PORTRAITS = [1, 2, 3].map((n) => `${import.meta.env.BASE_URL}avatars/alumni-${String(n).padStart(2, "0")}.jpg`);

function useAuthed() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  return (s: Session, to?: string) => {
    sessionStorage.removeItem(PATH_KEY);
    qc.clear();
    qc.setQueryData(getGetSessionQueryKey(), s);
    setLocation(to ?? homeFor(s.user));
  };
}

function Frame({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-cardinal lg:block">
        <img src={`${import.meta.env.BASE_URL}hero-path.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-cardinal/90 to-cardinal-deep/80" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" data-testid="link-home-auth"><Logo light /></Link>
          <blockquote className="max-w-lg">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex -space-x-3">
                {FEATURED_PORTRAITS.map((src, index) => (
                  <img key={src} src={src} alt="" aria-hidden="true" className="h-12 w-12 rounded-full border-2 border-cardinal object-cover shadow-sm" style={{ zIndex: FEATURED_PORTRAITS.length - index }} />
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">AI-generated demo portraits</p>
            </div>
            <p className="font-display text-4xl leading-tight text-white">Somebody already walked your path. <span className="text-gold">Go say hi.</span></p>
          </blockquote>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-paper px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="lg:hidden" data-testid="link-home-auth-mobile"><Logo /></Link>
          <h1 className="mt-8 font-display text-4xl lg:mt-0">{title}</h1>
          <p className="mt-2 text-muted-foreground">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function DemoCard({ onPick }: { onPick: (email: string) => void }) {
  const demo = useDemoLogin();
  const done = useAuthed();
  return (
    <div className="mt-8 rounded-3xl border-2 border-dashed border-gold bg-gold-soft/50 p-5" data-testid="card-demo-credentials">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cardinal"><KeyRound className="h-3.5 w-3.5" />Demo credentials for judges</p>
      <div className="mt-3 space-y-2">
        {DEMO.map((d, i) => (
          <div key={d.email} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{d.who} <span className="font-normal text-muted-foreground">· {d.what}</span></p>
              <p className="font-mono text-xs text-foreground/80" data-testid={`text-demo-email-${i}`}>{d.email}</p>
              <p className="font-mono text-xs text-foreground/80" data-testid={`text-demo-password-${i}`}>{DEMO_PW}</p>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => onPick(d.email)} className="rounded-full border px-3 py-1.5 text-xs font-medium hover:border-cardinal" data-testid={`button-fill-demo-${i}`}>Fill</button>
              <button type="button" disabled={demo.isPending} onClick={() => demo.mutate({ data: { role: i === 0 ? "student" : "alumni" } }, { onSuccess: (s) => done(s) })} className="rounded-full bg-cardinal px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" data-testid={`button-demo-login-${i}`}>Enter</button>
            </div>
          </div>
        ))}
      </div>
      {demo.isError && <p className="mt-2 text-sm text-destructive">{errMsg(demo.error)}</p>}
    </div>
  );
}

const field = "h-12 rounded-xl bg-card text-base";

export function Login() {
  const { user } = useMe();
  const done = useAuthed();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (user) return <Redirect to={homeFor(user)} />;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email: email.trim(), password } }, { onSuccess: (s) => done(s) });
  };
  return (
    <Frame title="Welcome back, Trojan." sub="Pick up where your path left off.">
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} data-testid="input-email" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} data-testid="input-password" /></div>
        {login.isError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="text-login-error">{errMsg(login.error, "Email or password did not match.")}</p>}
        <button disabled={login.isPending} className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cardinal font-semibold text-white transition-transform active:scale-[.98] disabled:opacity-60" data-testid="button-login">
          {login.isPending ? "Signing in..." : "Log in"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <p className="text-center text-sm text-muted-foreground">New here? <Link href="/register" className="font-medium text-cardinal hover:underline" data-testid="link-register">Create an account</Link></p>
      </form>
      <DemoCard onPick={(e) => { setEmail(e); setPassword(DEMO_PW); }} />
    </Frame>
  );
}

export function Register() {
  const { user } = useMe();
  const done = useAuthed();
  const reg = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "alumni">("student");
  if (user) return <Redirect to={homeFor(user)} />;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    reg.mutate({ data: { name: name.trim(), email: email.trim(), password, role } }, { onSuccess: (s) => done(s, "/profile?welcome=1") });
  };
  return (
    <Frame title="Start your path." sub="Two minutes to set up. Your resume can do most of the typing.">
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
          {(["student", "alumni"] as const).map((r) => (
            <button type="button" key={r} onClick={() => setRole(r)} className={cn("rounded-xl py-2.5 text-sm font-semibold transition-all", role === r ? "bg-card text-cardinal shadow-sm" : "text-muted-foreground")} data-testid={`button-role-${r}`}>
              {r === "student" ? "I'm a student" : "I'm an alum"}
            </button>
          ))}
        </div>
        <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={field} data-testid="input-name" /></div>
        <div className="space-y-1.5"><Label htmlFor="remail">Email</Label><Input id="remail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} data-testid="input-email" /></div>
        <div className="space-y-1.5"><Label htmlFor="rpw">Password</Label><Input id="rpw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className={field} data-testid="input-password" /><p className="text-xs text-muted-foreground">At least 8 characters. We never show your email to anyone.</p></div>
        {reg.isError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="text-register-error">{errMsg(reg.error)}</p>}
        <button disabled={reg.isPending} className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cardinal font-semibold text-white transition-transform active:scale-[.98] disabled:opacity-60" data-testid="button-register">
          {reg.isPending ? "Creating..." : "Create account"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <p className="text-center text-sm text-muted-foreground">Already have one? <Link href="/login" className="font-medium text-cardinal hover:underline" data-testid="link-login">Log in</Link></p>
      </form>
      <DemoCard onPick={() => {}} />
    </Frame>
  );
}
