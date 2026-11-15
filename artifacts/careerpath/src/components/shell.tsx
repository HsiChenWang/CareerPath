import { useState, type ReactNode } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useHealthCheck, useLogout } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonAvatar } from "@/components/bits";
import { useMe, homeFor, isProfileComplete, PATH_KEY } from "@/lib/cp";
import { cn } from "@/lib/utils";

const STUDENT_NAV = [
  ["/connect", "Connect"], ["/my-network", "My Network"],
] as const;
const ALUMNI_NAV = [["/requests", "Requests"], ["/upcoming-chats", "Upcoming Chats"]] as const;

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-cardinal">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M5 19 C 9 15, 8 9, 12 9 S 16 5, 19 4" fill="none" stroke="#FFCC00" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 4.2" />
          <circle cx="19" cy="4" r="2.2" fill="#FFCC00" />
        </svg>
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-tight", light ? "text-white" : "text-ink")}>
        NextStep<span className={light ? "text-gold" : "text-cardinal"}>SC</span>
      </span>
    </span>
  );
}

export function useSignOut() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  return () =>
    logout.mutate(undefined, {
      onSettled: () => {
        sessionStorage.removeItem(PATH_KEY);
        qc.clear();
        setLocation("/");
      },
    });
}

export function AppNav() {
  const { user } = useMe();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  if (!user) return null;
  const nav = user.role === "alumni" ? ALUMNI_NAV : STUDENT_NAV;
  const active = (h: string) => location === h || location.startsWith(h + "/");
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Link href={homeFor(user)} data-testid="link-home"><Logo /></Link>
        <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
          {nav.map(([h, l]) => (
            <Link key={h} href={h} className={cn("relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors", active(h) ? "bg-cardinal text-white" : "text-foreground/70 hover:bg-muted hover:text-foreground")} data-testid={`link-nav-${l.toLowerCase().replace(/\s/g, "-")}`}>
              {l}
              {active(h) && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2 transition-colors hover:border-cardinal/30" aria-label="Open account menu" data-testid="button-account-menu">
                <PersonAvatar person={user} size={28} className="rounded-full" />
                <span className="hidden text-sm font-medium sm:inline">{user.name.split(" ")[0]}</span>
                <span className="hidden rounded-full bg-gold px-1.5 text-[10px] font-semibold uppercase text-ink md:inline">{user.role === "alumni" ? "Alum" : "Student"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate font-semibold text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role === "alumni" ? "Alumni" : "Student"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" data-testid="link-profile-menu">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={signOut} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => setOpen(true)} className="rounded-full p-2 hover:bg-muted lg:hidden" aria-label="Menu" data-testid="button-menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="bg-paper">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo />
          <nav className="mt-8 flex flex-col gap-1">
            {nav.map(([h, l]) => (
              <Link key={h} href={h} onClick={() => setOpen(false)} className={cn("rounded-2xl px-4 py-3 font-display text-xl", active(h) ? "bg-cardinal text-white" : "hover:bg-muted")} data-testid={`link-mobile-${l.toLowerCase().replace(/\s/g, "-")}`}>
                {l}
              </Link>
            ))}
          </nav>
          <button onClick={signOut} className="mt-8 flex items-center gap-2 px-4 text-sm text-muted-foreground" data-testid="button-logout-mobile">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function Footer() {
  const health = useHealthCheck();
  return (
    <footer className="border-t border-border/70 bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden md:inline">for Trojans, by the Trojans who came before.</span>
        </div>
        <div className="flex items-center gap-4">
          <span data-testid="text-demo-disclaimer">Demo uses sample alumni data.</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider" data-testid="status-health">
            <span className={cn("h-2 w-2 rounded-full", health.data?.status ? "bg-emerald-600" : "bg-gold")} />
            {health.data?.status ? "Live" : "Connecting"}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function Guard({ role, children }: { role?: "student" | "alumni"; children: ReactNode }) {
  const { user, isLoading } = useMe();
  const [location] = useLocation();
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 md:px-8">
        <Skeleton className="h-12 w-2/3 rounded-2xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (role && user.role !== role) return <Redirect to={homeFor(user)} />;
  if (!isProfileComplete(user) && location.split("?")[0] !== "/profile") return <Redirect to="/profile?welcome=1" />;
  return <>{children}</>;
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-10 md:px-8 md:pt-14", className)}>{children}</main>;
}
