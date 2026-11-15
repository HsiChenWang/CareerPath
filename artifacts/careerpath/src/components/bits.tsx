import { useState, type KeyboardEvent, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import type { Person, TimelineStep } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/cp";

export function PersonAvatar({ person, size = 48, className }: { person: Pick<Person, "name" | "photo" | "role">; size?: number; className?: string }) {
  const alum = person.role === "alumni";
  const [photoFailed, setPhotoFailed] = useState(false);
  if (person.photo && !photoFailed) {
    const photoSrc = /^(https?:|data:|blob:|\/)/i.test(person.photo)
      ? person.photo
      : `${import.meta.env.BASE_URL}${person.photo.replace(/^\/+/, "")}`;
    return <img src={photoSrc} alt={person.photo.startsWith("avatars/") ? `${person.name}, AI-generated profile portrait` : person.name} title={person.photo.startsWith("avatars/") ? "AI-generated demo portrait" : undefined} onError={() => setPhotoFailed(true)} style={{ width: size, height: size }} className={cn("rounded-2xl object-cover shrink-0", className)} data-testid="img-avatar" />;
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        "rounded-2xl grid place-items-center font-display font-semibold shrink-0 select-none",
        alum ? "bg-cardinal text-gold" : "bg-gold text-cardinal-deep",
        className,
      )}
      data-testid="img-avatar"
    >
      {initials(person.name)}
    </div>
  );
}

export function AiThinking({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border border-gold/50 bg-gold-soft/60 px-4 py-3 text-sm text-ink", className)} data-testid="status-ai-loading">
      <span className="hop flex gap-1 text-cardinal font-bold text-lg leading-none">
        <span>.</span><span>.</span><span>.</span>
      </span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function FallbackNote({ show }: { show?: boolean }) {
  if (!show) return null;
  return <p className="text-xs text-muted-foreground mt-2">The AI took a breather, so this is a thoughtful template. Edit freely.</p>;
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-3xl border border-destructive/25 bg-destructive/5 p-8 text-center" data-testid="status-error">
      <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
      <p className="mt-3 font-display text-xl">That did not load.</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 rounded-full" onClick={onRetry} data-testid="button-retry">
          <RotateCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyBlock({ title, body, action, icon }: { title: string; body: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-cardinal/25 bg-card/60 p-10 text-center" data-testid="status-empty">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold-soft text-cardinal">{icon}</div>
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CardSkeletons({ n = 3, h = 220 }: { n?: number; h?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} style={{ height: h }} className="rounded-3xl bg-muted" />
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="rise mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cardinal">
          <span className="h-1.5 w-1.5 rounded-full bg-gold ring-2 ring-cardinal/20" /> {eyebrow}
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
        {sub && <p className="mt-3 text-base text-muted-foreground md:text-lg">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "gold" | "cardinal" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "muted" && "bg-muted text-foreground/75",
        tone === "gold" && "bg-gold text-ink",
        tone === "cardinal" && "bg-cardinal/10 text-cardinal",
      )}
    >
      {children}
    </span>
  );
}

export function TagInput({ value, onChange, placeholder, testId, highlight }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; testId: string; highlight?: boolean }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().replace(/,$/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className={cn("flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-card px-2 py-1.5 transition-colors focus-within:border-cardinal", highlight && "ring-2 ring-gold/60")}>
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-cardinal/8 bg-cardinal/10 px-2.5 py-1 text-xs font-medium text-cardinal">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full hover:text-ink" aria-label={`Remove ${t}`} data-testid={`button-remove-${testId}-${t}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
        data-testid={`input-${testId}`}
      />
    </div>
  );
}

export function Timeline({ steps, compact }: { steps: TimelineStep[]; compact?: boolean }) {
  if (!steps.length) return <p className="text-sm text-muted-foreground">No timeline shared yet.</p>;
  return (
    <ol className="relative">
      <span className="trail absolute left-[7px] top-2 bottom-2 w-1" aria-hidden />
      {steps.map((s, i) => (
        <li key={i} className={cn("relative pl-8", compact ? "pb-3" : "pb-6")} data-testid={`timeline-step-${i}`}>
          <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-[3px] border-cardinal bg-card" />
          <p className="font-mono text-[11px] uppercase tracking-wider text-cardinal">{s.year}</p>
          <p className={cn("font-semibold leading-snug", compact ? "text-sm" : "text-base")}>{s.title}</p>
          {!compact && s.detail && <p className="mt-0.5 text-sm text-muted-foreground">{s.detail}</p>}
        </li>
      ))}
    </ol>
  );
}
