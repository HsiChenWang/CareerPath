import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, FastForward, Flag, Hourglass, Network as NetIcon, Send, Sparkles, Users } from "lucide-react";
import {
  useAdvanceTime, useAskAi, useGetNetwork, useUpdateFollowup, useRecordMilestone,
  getGetNetworkQueryKey, getGetConversationsQueryKey, getGetChatsQueryKey, getGetGapQueryKey,
} from "@workspace/api-client-react";
import type { Followup } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, CardSkeletons, EmptyBlock, ErrorBlock, PageHeader, PersonAvatar, Tag } from "@/components/bits";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { errMsg, fmtShort, fmtTime, useMe } from "@/lib/cp";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  Messaged: "bg-muted text-foreground/75", Replied: "bg-emerald-100 text-emerald-900", "Chat scheduled": "bg-gold text-ink",
  "Chat done": "bg-cardinal text-white", "Follow-up due": "bg-cardinal/10 text-cardinal",
};

function FollowupCard({ f }: { f: Followup }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState(f.draft);
  const [editing, setEditing] = useState(false);
  const update = useUpdateFollowup();
  const ai = useAskAi();
  const act = (action: "send" | "edit" | "snooze" | "skip") =>
    update.mutate({ id: f.id, data: { action, draft } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
        qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        if (action === "edit") setEditing(false);
        toast({ title: action === "send" ? `Sent to ${f.person.name.split(" ")[0]}` : action === "snooze" ? "Snoozed for a few days" : action === "skip" ? "Skipped" : "Draft saved" });
      },
      onError: (e) => toast({ title: "That did not work", description: errMsg(e), variant: "destructive" }),
    });
  const redraft = () => ai.mutate({ data: { kind: "followup", personId: f.person.id, prompt: f.reason, text: draft } }, { onSuccess: (r) => { setDraft(r.text); setEditing(true); } });
  return (
    <div className="rise rounded-[1.5rem] border bg-card p-5" data-testid={`card-followup-${f.id}`}>
      <div className="flex items-start gap-3">
        <PersonAvatar person={f.person} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{f.person.name}</p><Tag tone="gold">{f.kind}</Tag></div>
          <p className="text-sm text-muted-foreground">{f.reason} · due {fmtShort(f.dueAt)}</p>
        </div>
      </div>
      {ai.isPending ? <AiThinking label="Rewriting with your notes..." className="mt-4" /> : (
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} readOnly={!editing} rows={4} className={cn("mt-4 rounded-2xl bg-paper text-sm", !editing && "focus-visible:ring-0")} data-testid={`input-followup-${f.id}`} />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => act("send")} disabled={update.isPending || !draft.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" data-testid={`button-followup-send-${f.id}`}><Send className="h-3.5 w-3.5" />Send</button>
        {editing ? (
          <button onClick={() => act("edit")} disabled={update.isPending} className="rounded-full border px-4 py-2 text-sm font-medium" data-testid={`button-followup-save-${f.id}`}>Save edit</button>
        ) : (
          <button onClick={() => setEditing(true)} className="rounded-full border px-4 py-2 text-sm font-medium hover:border-cardinal" data-testid={`button-followup-edit-${f.id}`}>Edit</button>
        )}
        <button onClick={redraft} disabled={ai.isPending} className="inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-medium text-cardinal hover:border-cardinal" data-testid={`button-followup-redraft-${f.id}`}><Sparkles className="h-3.5 w-3.5" />Redraft</button>
        <button onClick={() => act("snooze")} disabled={update.isPending} className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted" data-testid={`button-followup-snooze-${f.id}`}>Snooze</button>
        <button onClick={() => act("skip")} disabled={update.isPending} className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted" data-testid={`button-followup-skip-${f.id}`}>Skip</button>
      </div>
    </div>
  );
}

function Milestone() {
  const milestone = useRecordMilestone();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [m, setM] = useState("");
  return (
    <div className="rounded-[1.75rem] border bg-card p-6">
      <p className="flex items-center gap-2 font-display text-xl"><Flag className="h-5 w-5 text-cardinal" />Hit a milestone?</p>
      <p className="mt-1 text-sm text-muted-foreground">Got an internship, joined a recommended club? We will suggest who to update and draft it.</p>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (m.trim().length < 3) return;
        milestone.mutate({ data: { title: m.trim() } }, {
          onSuccess: (network) => {
            qc.setQueryData(getGetNetworkQueryKey(), network);
            qc.invalidateQueries({ queryKey: getGetGapQueryKey() });
            setM("");
            toast({ title: "Milestone saved", description: "Relevant alumni updates appear in Follow-ups due. Review each draft before sending." });
          },
        });
      }} className="mt-4 flex gap-2">
        <Input value={m} onChange={(e) => setM(e.target.value)} placeholder="e.g. Joined Lavalab" className="rounded-xl bg-paper" data-testid="input-milestone" />
        <button disabled={m.trim().length < 3 || milestone.isPending} className="rounded-xl bg-cardinal px-4 text-sm font-semibold text-white disabled:opacity-50" data-testid="button-milestone">Save</button>
      </form>
      {milestone.isPending && <AiThinking label="Finding who would love to hear this..." className="mt-3" />}
      {milestone.isError && <p className="mt-3 text-sm text-destructive">{errMsg(milestone.error)}</p>}
      {milestone.isSuccess && <p className="mt-3 text-sm text-cardinal" data-testid="text-milestone-result">Saved to My Gap. Updates for relevant connections are ready to review in Follow-ups due.</p>}
    </div>
  );
}

export default function MyNetwork() {
  const { user } = useMe();
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useGetNetwork({ query: { queryKey: getGetNetworkQueryKey(), refetchInterval: 15000 } });
  const advance = useAdvanceTime();
  const weekly = useAskAi();
  const n = q.data;

  const ff = () => advance.mutate(undefined, {
    onSuccess: (net) => {
      qc.setQueryData(getGetNetworkQueryKey(), net);
      qc.invalidateQueries({ queryKey: getGetChatsQueryKey() });
      toast({ title: "One week later...", description: `${net.followups.length} follow-up${net.followups.length === 1 ? "" : "s"} now due.` });
    },
    onError: (e) => toast({ title: "Time stood still", description: errMsg(e), variant: "destructive" }),
  });

  const upcoming = n?.chats.filter((c) => c.status === "accepted" && new Date(c.scheduledAt) >= new Date(n.now)) ?? [];
  const waitingPeople = n?.connections.filter((c) => c.status === "Messaged") ?? [];
  const rel = n?.connections.filter((c) => n.chats.some(chat => chat.person.id === c.person.id && chat.status === "completed")) ?? [];

  return (
    <Page>
      <PageHeader eyebrow="My Network" title={<>Connections into <span className="text-cardinal">relationships.</span></>}>
        {user?.isDemo && (
          <button onClick={ff} disabled={advance.isPending} className="inline-flex items-center gap-2 self-start rounded-full border-2 border-ink bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-transform active:scale-95 disabled:opacity-60" data-testid="button-fast-forward">
            <FastForward className="h-4 w-4" />{advance.isPending ? "Skipping ahead..." : "Fast-forward 1 week"}
            {!!n?.offsetDays && <span className="font-mono text-[10px]">+{n.offsetDays}d</span>}
          </button>
        )}
      </PageHeader>
      {q.isLoading ? <div className="space-y-5"><AiThinking label="Writing your weekly networking brief..." className="max-w-md" /><CardSkeletons n={3} /></div> : q.isError || !n ? <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} /> : (
        <div className="space-y-10">
          <div className="rise relative overflow-hidden rounded-[2rem] bg-cardinal p-7 text-white md:p-9">
            <div className="trail-h absolute bottom-0 left-0 right-0 h-1" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">This week · {fmtShort(n.now)}</p>
            <p className="mt-2 max-w-3xl font-display text-2xl leading-snug md:text-3xl" data-testid="text-network-summary">{weekly.data?.text || n.summary}</p>
            <div className="mt-6 flex flex-wrap gap-6">
              {[["Follow-ups due", n.followups.length], ["Upcoming chats", upcoming.length], ["Waiting on reply", n.waiting], ["Relationships", n.relationships]].map(([l, v]) => (
                <div key={l as string}><p className="font-display text-4xl text-gold">{v}</p><p className="text-xs text-white/70">{l}</p></div>
              ))}
            </div>
            <button onClick={() => weekly.mutate({ data: { kind: "weekly" } })} disabled={weekly.isPending} className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20" data-testid="button-weekly-coach"><Sparkles className="h-3.5 w-3.5" />{weekly.isPending ? "Thinking..." : "Refresh my weekly coach"}</button>
            {!!weekly.data?.actions.length && <ul className="mt-4 space-y-1 text-sm text-white/85">{weekly.data.actions.map((a, i) => <li key={i}>· {a}</li>)}</ul>}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-2xl"><Clock className="h-5 w-5 text-cardinal" />Follow-ups due</h2>
              {n.followups.length ? <div className="space-y-4">{n.followups.map((f) => <FollowupCard key={f.id} f={f} />)}</div> : (
                <EmptyBlock icon={<Clock className="h-6 w-6" />} title="All caught up" body={user?.isDemo ? "Try Fast-forward 1 week to see thank-yous, nudges and check-ins appear." : "We will draft thank-yous, nudges and check-ins when they are due."} />
              )}
            </section>
            <div className="space-y-6">
              <section className="rounded-[1.75rem] border bg-card p-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-xl"><CalendarDays className="h-5 w-5 text-cardinal" />Upcoming chats</h2>
                {upcoming.length ? upcoming.map((c) => (
                  <Link key={c.id} href="/upcoming-chats" className="flex items-center gap-3 rounded-2xl p-2 hover:bg-muted" data-testid={`link-upcoming-${c.id}`}><PersonAvatar person={c.person} size={36} /><div><p className="text-sm font-semibold">{c.person.name}</p><p className="text-xs text-muted-foreground">{fmtTime(c.scheduledAt)}</p></div></Link>
                )) : <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
              </section>
              <section className="rounded-[1.75rem] border bg-card p-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-xl"><Hourglass className="h-5 w-5 text-cardinal" />Waiting for reply</h2>
                {waitingPeople.length ? waitingPeople.map((c) => (
                  <div key={c.person.id} className="flex items-center gap-3 p-2"><PersonAvatar person={c.person} size={36} /><div><p className="text-sm font-semibold">{c.person.name}</p><p className="text-xs text-muted-foreground">Messaged {fmtShort(c.lastContact)}</p></div></div>
                )) : <p className="text-sm text-muted-foreground">No one is keeping you waiting.</p>}
              </section>
              <section className="rounded-[1.75rem] border bg-card p-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-xl"><Users className="h-5 w-5 text-cardinal" />Relationships</h2>
                {rel.length ? rel.map((c) => (
                  <Link key={c.person.id} href={`/people/${c.person.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-muted"><PersonAvatar person={c.person} size={36} /><div><p className="text-sm font-semibold">{c.person.name}</p><p className="text-xs text-muted-foreground">Last chat {fmtShort(c.lastContact)}</p></div></Link>
                )) : <p className="text-sm text-muted-foreground">Your first coffee chat starts this list.</p>}
              </section>
              <Milestone />
            </div>
          </div>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl"><NetIcon className="h-5 w-5 text-cardinal" />Everyone</h2>
            {n.connections.length ? (
              <div className="overflow-hidden rounded-[1.75rem] border bg-card">
                {n.connections.map((c) => (
                  <Link key={c.person.id} href={`/people/${c.person.id}`} className="flex items-center gap-4 border-b px-5 py-3 last:border-0 hover:bg-muted/50" data-testid={`row-connection-${c.person.id}`}>
                    <PersonAvatar person={c.person} size={36} />
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.person.name}</p><p className="truncate text-xs text-muted-foreground">{c.person.currentRole}{c.person.company ? `, ${c.person.company}` : ""}</p></div>
                    <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">{fmtShort(c.lastContact)}</span>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_TONE[c.status] ?? "bg-muted")}>{c.status}</span>
                  </Link>
                ))}
              </div>
            ) : <EmptyBlock icon={<Users className="h-6 w-6" />} title="Your network starts with one message" body="Head to Connect and reach out to an alum who shares your start." action={<Link href="/connect" className="rounded-full bg-cardinal px-5 py-2.5 text-sm font-semibold text-white">Find Trojans</Link>} />}
          </section>
        </div>
      )}
    </Page>
  );
}
