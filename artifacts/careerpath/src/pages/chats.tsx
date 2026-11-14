import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Check, Coffee, Inbox, MapPin, NotebookPen, Sparkles, Video, X, Clock3 } from "lucide-react";
import {
  useAskAi, useGetChats, useUpdateChat,
  getGetChatsQueryKey, getGetGapQueryKey, getGetNetworkQueryKey,
} from "@workspace/api-client-react";
import type { AiResult, CoffeeChat, ChatUpdate } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, CardSkeletons, EmptyBlock, ErrorBlock, FallbackNote, PageHeader, PersonAvatar, Tag } from "@/components/bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiBase, errMsg, fmtTime, roleLine, useMe } from "@/lib/cp";
import { cn } from "@/lib/utils";

function useChatUpdate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateChat();
  const run = (id: string, data: ChatUpdate, msg: string, after?: (c: CoffeeChat) => void) =>
    update.mutate({ id, data }, {
      onSuccess: (c) => {
        qc.invalidateQueries({ queryKey: getGetChatsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
        if (data.action === "notes") qc.invalidateQueries({ queryKey: getGetGapQueryKey() });
        toast({ title: msg });
        after?.(c);
      },
      onError: (e) => toast({ title: "That did not go through", description: errMsg(e), variant: "destructive" }),
    });
  return { run, pending: update.isPending };
}

function ChatHead({ chat }: { chat: CoffeeChat }) {
  return (
    <div className="flex items-start gap-4">
      <PersonAvatar person={chat.person} size={52} />
      <div className="min-w-0 flex-1">
        <Link href={`/people/${chat.person.id}`} className="font-display text-xl hover:text-cardinal" data-testid={`link-chat-person-${chat.id}`}>{chat.person.name}</Link>
        <p className="truncate text-sm text-muted-foreground">{roleLine(chat.person)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Tag tone="cardinal">{chat.duration} min</Tag>
          <Tag>{chat.format === "campus" ? <><MapPin className="mr-1 h-3 w-3" />On campus</> : <><Video className="mr-1 h-3 w-3" />Virtual</>}</Tag>
          <Tag tone={chat.status === "accepted" ? "gold" : "muted"}>{chat.status}</Tag>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ALUMNI REQUESTS ---------------- */

function RequestCard({ chat }: { chat: CoffeeChat }) {
  const { run, pending } = useChatUpdate();
  const ai = useAskAi();
  const brief = useAskAi();
  const [picked, setPicked] = useState(chat.times[0] ?? "");
  const [mode, setMode] = useState<"none" | "suggest" | "decline">("none");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const first = chat.person.name.split(" ")[0];

  const draftDecline = () => { setMode("decline"); ai.mutate({ data: { kind: "decline", chatId: chat.id, personId: chat.person.id } }, { onSuccess: (r) => setNote(r.text) }); };

  return (
    <article className="rise rounded-[1.75rem] border bg-card p-6" data-testid={`card-request-${chat.id}`}>
      <ChatHead chat={chat} />
      <div className="mt-4">
        <button onClick={() => brief.mutate({ data: { kind: "coach", personId: chat.person.id, chatId: chat.id, page: "/requests", prompt: "Summarize in one line who this student is and what they want, before I reply." } })} disabled={brief.isPending} className="inline-flex items-center gap-1.5 text-sm font-medium text-cardinal hover:underline" data-testid={`button-brief-${chat.id}`}><Sparkles className="h-3.5 w-3.5" />Who is {first}?</button>
        {brief.isPending && <AiThinking label="Reading their profile..." className="mt-2" />}
        {brief.data && <p className="mt-2 rounded-2xl bg-gold-soft/60 px-4 py-3 text-sm" data-testid={`text-brief-${chat.id}`}>{brief.data.text}</p>}
      </div>
      {chat.note && <blockquote className="mt-4 border-l-4 border-gold pl-4 text-sm italic text-foreground/80">"{chat.note}"</blockquote>}

      <p className="mb-2 mt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Times {first} proposed</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {chat.times.map((t, i) => (
          <button key={t} onClick={() => setPicked(t)} className={cn("rounded-xl border px-3 py-2.5 text-left text-sm transition-all", picked === t ? "border-cardinal bg-cardinal/5 font-semibold text-cardinal" : "hover:border-cardinal/40")} data-testid={`button-pick-time-${chat.id}-${i}`}>{fmtTime(t)}</button>
        ))}
      </div>

      {mode === "suggest" && (
        <div className="mt-4 space-y-2 rounded-2xl bg-muted/50 p-4">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="rounded-xl bg-card" data-testid={`input-suggest-time-${chat.id}`} />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note" className="rounded-xl bg-card" data-testid={`input-suggest-note-${chat.id}`} />
          <button disabled={!when || pending} onClick={() => run(chat.id, { action: "suggest", scheduledAt: new Date(when).toISOString(), note: note || undefined }, `Suggested a new time to ${first}`)} className="rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" data-testid={`button-send-suggest-${chat.id}`}>Send suggestion</button>
        </div>
      )}
      {mode === "decline" && (
        <div className="mt-4 space-y-2 rounded-2xl bg-muted/50 p-4">
          {ai.isPending ? <AiThinking label="Drafting a kind, honest no..." /> : <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="rounded-xl bg-card" data-testid={`input-decline-note-${chat.id}`} />}
          <FallbackNote show={ai.data?.fallback} />
          <button disabled={!note.trim() || pending} onClick={() => run(chat.id, { action: "decline", note }, "Declined kindly")} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50" data-testid={`button-send-decline-${chat.id}`}>Send decline</button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
        <button disabled={!picked || pending} onClick={() => run(chat.id, { action: "accept", scheduledAt: picked }, `Chat with ${first} booked`)} className="inline-flex items-center gap-1.5 rounded-full bg-cardinal px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" data-testid={`button-accept-${chat.id}`}><Check className="h-4 w-4" />Accept {picked ? fmtTime(picked).split(" · ")[0] : ""}</button>
        <button onClick={() => setMode(mode === "suggest" ? "none" : "suggest")} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:border-cardinal" data-testid={`button-suggest-${chat.id}`}><Clock3 className="h-4 w-4" />Suggest another time</button>
        <button onClick={() => (mode === "decline" ? setMode("none") : draftDecline())} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted" data-testid={`button-decline-${chat.id}`}><X className="h-4 w-4" />Decline</button>
      </div>
    </article>
  );
}

export function Requests() {
  const q = useGetChats({ query: { queryKey: getGetChatsQueryKey(), refetchInterval: 5000 } });
  const pending = q.data?.filter((c) => c.status === "pending") ?? [];
  const others = q.data?.filter((c) => c.status === "suggested" || c.status === "declined") ?? [];
  return (
    <Page>
      <PageHeader eyebrow="Requests" title={<>Trojans asking for <span className="text-cardinal">fifteen minutes.</span></>} sub="Accept a time, suggest another, or decline kindly. You are always in control." >
        <Link href="/profile" className="self-start rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-cardinal" data-testid="link-availability">Availability and pause</Link>
      </PageHeader>
      {q.isLoading ? <CardSkeletons n={2} h={320} /> : q.isError ? <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} /> : (
        <div className="space-y-10">
          {pending.length ? <div className="grid gap-6 xl:grid-cols-2">{pending.map((c) => <RequestCard key={c.id} chat={c} />)}</div> : (
            <EmptyBlock icon={<Inbox className="h-6 w-6" />} title="No new requests" body="When a student asks for a coffee chat, it lands here with a quick AI brief on who they are." />
          )}
          {!!others.length && (
            <section>
              <h2 className="mb-3 font-display text-2xl">Waiting on students</h2>
              <div className="space-y-2">{others.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3"><PersonAvatar person={c.person} size={36} /><p className="flex-1 text-sm"><span className="font-semibold">{c.person.name}</span> · {c.status === "suggested" ? `you suggested ${fmtTime(c.scheduledAt)}` : "declined"}</p></div>
              ))}</div>
            </section>
          )}
        </div>
      )}
    </Page>
  );
}

/* ---------------- UPCOMING CHATS ---------------- */

function UpcomingCard({ chat, student }: { chat: CoffeeChat; student: boolean }) {
  const { run, pending } = useChatUpdate();
  const prep = useAskAi();
  const [prepData, setPrepData] = useState<AiResult | null>(null);
  const [notes, setNotes] = useState(chat.notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const isAccepted = chat.status === "accepted";
  const done = chat.status === "completed" || !!chat.summary;
  return (
    <article className="rise rounded-[1.75rem] border bg-card p-6" data-testid={`card-chat-${chat.id}`}>
      <ChatHead chat={chat} />
      {chat.scheduledAt && (
        <div className={cn("mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4", isAccepted ? "bg-cardinal text-white" : "bg-muted")}>
          <div><p className={cn("font-mono text-[10px] uppercase tracking-wider", isAccepted ? "text-gold" : "text-muted-foreground")}>{chat.status === "suggested" ? "New time suggested" : "Scheduled"}</p><p className="font-display text-xl" data-testid={`text-chat-time-${chat.id}`}>{fmtTime(chat.scheduledAt)}</p></div>
          {isAccepted && <a href={`${apiBase}/api/chats/${chat.id}/calendar`} download className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink" data-testid={`link-calendar-${chat.id}`}><CalendarPlus className="h-4 w-4" />Add to calendar</a>}
          {chat.status === "suggested" && student && <button disabled={pending} onClick={() => run(chat.id, { action: "accept", scheduledAt: chat.scheduledAt }, "Time accepted")} className="rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white" data-testid={`button-accept-suggested-${chat.id}`}>Accept this time</button>}
        </div>
      )}
      {chat.status === "pending" && <p className="mt-4 rounded-2xl bg-gold-soft/60 px-4 py-3 text-sm">{student ? `Waiting for ${chat.person.name.split(" ")[0]} to pick a time.` : "Pending in your Requests."} Proposed: {chat.times.map(fmtTime).join(" / ")}</p>}

      {isAccepted && !done && (
        <div className="mt-5">
          <button onClick={() => prep.mutate({ data: { kind: "prep", chatId: chat.id, personId: chat.person.id } }, { onSuccess: setPrepData })} disabled={prep.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-cardinal/30 px-4 py-2 text-sm font-semibold text-cardinal hover:bg-gold-soft" data-testid={`button-prep-${chat.id}`}><Sparkles className="h-4 w-4" />{prepData ? "Refresh prep brief" : "AI prep brief"}</button>
          {prep.isPending && <AiThinking label="Building your prep brief..." className="mt-3" />}
          {prep.isError && <p className="mt-2 text-sm text-destructive">{errMsg(prep.error)}</p>}
          {prepData && (
            <div className="mt-4 space-y-4 rounded-2xl bg-paper p-5" data-testid={`text-prep-${chat.id}`}>
              <p className="text-sm leading-relaxed">{prepData.text}</p>
              {!!prepData.questions.length && <div><p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-cardinal">Smart questions</p><ol className="space-y-1.5 text-sm">{prepData.questions.map((x, i) => <li key={i} className="flex gap-2"><span className="font-display text-cardinal">{i + 1}.</span>{x}</li>)}</ol></div>}
              {prepData.avoid && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm"><span className="font-semibold text-destructive">Do not ask: </span>{prepData.avoid}</div>}
            </div>
          )}
        </div>
      )}

      {student && (isAccepted || done) && (
        <div className="mt-5 border-t pt-5">
          {chat.summary ? (
            <div className="space-y-3" data-testid={`text-summary-${chat.id}`}>
              <p className="font-mono text-[11px] uppercase tracking-wider text-cardinal">Chat summary</p>
              <p className="text-sm">{chat.summary}</p>
              {!!chat.actionItems.length && <ul className="space-y-1.5">{chat.actionItems.map((a, i) => <li key={i} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 text-cardinal" />{a}</li>)}</ul>}
              <Link href="/my-gap" className="inline-block text-sm font-semibold text-cardinal hover:underline" data-testid={`link-gap-${chat.id}`}>Added to My Gap</Link>
            </div>
          ) : showNotes ? (
            <div className="space-y-2">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder={"- Join a product club\n- Build something with real users\n- Ask about APM next fall"} className="rounded-2xl bg-paper" data-testid={`input-notes-${chat.id}`} />
              {pending && <AiThinking label="Turning your notes into next steps..." />}
              <button disabled={!notes.trim() || pending} onClick={() => run(chat.id, { action: "notes", notes }, "Notes summarized and added to My Gap")} className="rounded-full bg-cardinal px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" data-testid={`button-save-notes-${chat.id}`}>Summarize into actions</button>
            </div>
          ) : (
            <button onClick={() => setShowNotes(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-cardinal hover:underline" data-testid={`button-add-notes-${chat.id}`}><NotebookPen className="h-4 w-4" />Had the chat? Add your notes</button>
          )}
        </div>
      )}
    </article>
  );
}

export function UpcomingChats() {
  const { user } = useMe();
  const student = user?.role === "student";
  const q = useGetChats({ query: { queryKey: getGetChatsQueryKey(), refetchInterval: 5000 } });
  const all = q.data ?? [];
  const groups: [string, CoffeeChat[]][] = [
    ["Upcoming", all.filter((c) => c.status === "accepted" && !c.summary)],
    ["Needs your answer", all.filter((c) => c.status === "suggested")],
    ["Requested", all.filter((c) => c.status === "pending")],
    ["Past chats", all.filter((c) => c.status === "completed" || (c.status === "accepted" && !!c.summary))],
  ];
  return (
    <Page>
      <PageHeader eyebrow="Coffee chats" title={<>Fifteen minutes <span className="text-cardinal">can change a major.</span></>} sub={student ? "Prep before, notes after. We turn what you heard into next steps." : "Your scheduled chats with students, with a quick brief before each."} />
      {q.isLoading ? <CardSkeletons n={2} h={280} /> : q.isError ? <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} /> : !all.filter((c) => c.status !== "declined").length ? (
        <EmptyBlock icon={<Coffee className="h-6 w-6" />} title="No chats yet" body={student ? "Request a coffee chat from an alum on Connect." : "Accepted requests will appear here."} action={student ? <Link href="/connect" className="rounded-full bg-cardinal px-5 py-2.5 text-sm font-semibold text-white">Find alumni</Link> : undefined} />
      ) : (
        <div className="space-y-12">
          {groups.filter(([, l]) => l.length).map(([title, list]) => (
            <section key={title}>
              <h2 className="mb-4 font-display text-2xl">{title} <span className="font-mono text-sm text-muted-foreground">{list.length}</span></h2>
              <div className="grid gap-6 xl:grid-cols-2">{list.map((c) => <UpcomingCard key={c.id} chat={c} student={student} />)}</div>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
