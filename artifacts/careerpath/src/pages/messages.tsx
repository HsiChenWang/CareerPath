import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUp, Inbox, Sparkles, UserSearch } from "lucide-react";
import {
  useAskAi, useGetConversations, useGetMessages, useSendMessage,
  getGetConversationsQueryKey, getGetMessagesQueryKey, getGetNetworkQueryKey,
} from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, EmptyBlock, ErrorBlock, PersonAvatar } from "@/components/bits";
import { SafetyMenu } from "@/components/safety";
import { useCoach } from "@/components/coach";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { errMsg, fmtShort, fmtTime, roleLine, useMe } from "@/lib/cp";
import { cn } from "@/lib/utils";

export default function Messages({ title = "Messages" }: { title?: string }) {
  const { user } = useMe();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { setFocus } = useCoach();
  const active = new URLSearchParams(search).get("c") || "";
  const convos = useGetConversations({ query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 3000 } });
  const msgs = useGetMessages(active, { query: { enabled: !!active, queryKey: getGetMessagesQueryKey(active), refetchInterval: 3000 } });
  const send = useSendMessage();
  const aiReply = useAskAi();
  const aiBrief = useAskAi();
  const [text, setText] = useState("");
  const [brief, setBrief] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const convo = convos.data?.find((c) => c.id === active);
  const count = msgs.data?.length ?? 0;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [count, active]);
  useEffect(() => { setText(""); setBrief(""); }, [active]);
  const personId = convo?.person.id;
  const personName = convo?.person.name;
  useEffect(() => {
    if (personId) setFocus({ personId, label: personName });
    return () => setFocus({});
  }, [personId, personName, setFocus]);

  const onSend = () => {
    if (!text.trim() || !active) return;
    send.mutate({ id: active, data: { text: text.trim() } }, {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: getGetMessagesQueryKey(active) });
        qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
      },
      onError: (e) => toast({ title: "Not sent", description: errMsg(e), variant: "destructive" }),
    });
  };

  const helpReply = () => aiReply.mutate({ data: { kind: "reply", conversationId: active, personId } }, {
    onSuccess: (r) => setText(r.text),
    onError: (e) => toast({ title: "AI help unavailable", description: errMsg(e), variant: "destructive" }),
  });
  const whoIs = () => aiBrief.mutate({ data: { kind: "coach", personId, conversationId: active, page: "/messages", prompt: "In one or two lines, summarize who this student is and what they want, so I can reply quickly." } }, {
    onSuccess: (r) => setBrief(r.text),
    onError: (e) => setBrief(`Could not summarize right now (${errMsg(e)}).`),
  });

  const list = convos.data ?? [];

  return (
    <Page className="pb-24">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />Live</span>
      </div>
      {convos.isError ? <ErrorBlock message={errMsg(convos.error)} onRetry={() => convos.refetch()} /> : (
        <div className="grid h-[calc(100dvh-14rem)] min-h-[520px] overflow-hidden rounded-[2rem] border bg-card md:grid-cols-[320px_1fr]">
          <aside className={cn("flex flex-col border-r", active && "hidden md:flex")}>
            <div className="flex-1 overflow-y-auto p-2">
              {convos.isLoading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="m-2 h-16 rounded-2xl" />) : !list.length ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.{user?.role === "student" && <> Start one from <Link href="/connect" className="text-cardinal underline">Connect</Link>.</>}</div>
              ) : list.map((c) => (
                <button key={c.id} onClick={() => setLocation(`/messages?c=${c.id}`)} className={cn("flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors", active === c.id ? "bg-cardinal/8 bg-gold-soft" : "hover:bg-muted")} data-testid={`button-conversation-${c.id}`}>
                  <PersonAvatar person={c.person} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2"><p className="truncate font-semibold">{c.person.name}</p><span className="shrink-0 font-mono text-[10px] text-muted-foreground">{fmtShort(c.updatedAt)}</span></div>
                    <p className="truncate text-sm text-muted-foreground">{c.blocked ? "Blocked" : c.lastMessage || "No messages yet"}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>
          <section className={cn("flex min-h-0 flex-col", !active && "hidden md:flex")}>
            {!active || !convo ? (
              <div className="grid flex-1 place-items-center p-8"><EmptyBlock icon={<Inbox className="h-6 w-6" />} title="Pick a conversation" body="Replies show up here live, no refreshing needed." /></div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b px-4 py-3">
                  <button onClick={() => setLocation("/messages")} className="rounded-full p-1.5 hover:bg-muted md:hidden" aria-label="Back" data-testid="button-back-inbox"><ArrowLeft className="h-4 w-4" /></button>
                  <Link href={`/people/${convo.person.id}`} className="flex min-w-0 flex-1 items-center gap-3" data-testid="link-chat-person">
                    <PersonAvatar person={convo.person} size={40} />
                    <div className="min-w-0"><p className="truncate font-semibold">{convo.person.name}</p><p className="truncate text-xs text-muted-foreground">{roleLine(convo.person)}</p></div>
                  </Link>
                  {user?.role === "alumni" && <button onClick={whoIs} disabled={aiBrief.isPending} className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:border-cardinal sm:flex" data-testid="button-who-is"><UserSearch className="h-3.5 w-3.5" />Who is this?</button>}
                  <SafetyMenu personId={convo.person.id} name={convo.person.name} blocked={convo.blocked} />
                </header>
                {(brief || aiBrief.isPending) && <div className="border-b bg-gold-soft/50 px-5 py-3 text-sm">{aiBrief.isPending ? "Reading their profile..." : brief}</div>}
                <div className="flex-1 space-y-3 overflow-y-auto bg-paper/60 px-4 py-5">
                  {msgs.isLoading ? <Skeleton className="h-20 w-2/3 rounded-2xl" /> : msgs.isError ? <ErrorBlock message={errMsg(msgs.error)} onRetry={() => msgs.refetch()} /> : (msgs.data ?? []).map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={cn("rise flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", mine ? "rounded-br-md bg-cardinal text-white" : "rounded-bl-md border bg-card")} data-testid={`text-message-${m.id}`}>
                          <p className="whitespace-pre-wrap text-[15px]">{m.text}</p>
                          <p className={cn("mt-1 text-right font-mono text-[10px]", mine ? "text-white/60" : "text-muted-foreground")}>{fmtTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <footer className="border-t p-3">
                  {convo.blocked ? <p className="p-3 text-center text-sm text-muted-foreground">This conversation is blocked.</p> : !convo.canSend ? (
                    <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink" data-testid="text-anti-spam">Your first message is on its way. You can write again once {convo.person.name.split(" ")[0]} replies. That keeps things respectful for busy alumni.</p>
                  ) : (
                    <>
                      {aiReply.isPending && <AiThinking label="Reading the thread..." className="mb-2" />}
                      <div className="flex items-end gap-2">
                        <button onClick={helpReply} disabled={aiReply.isPending} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-cardinal/30 px-3 text-xs font-semibold text-cardinal hover:bg-gold-soft disabled:opacity-50" data-testid="button-ai-reply"><Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">AI help me reply</span></button>
                        <Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} rows={1} placeholder="Write a message..." className="min-h-11 resize-none rounded-2xl bg-paper" data-testid="input-message" />
                        <button onClick={onSend} disabled={!text.trim() || send.isPending} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cardinal text-white transition-transform active:scale-90 disabled:opacity-40" aria-label="Send" data-testid="button-send-message"><ArrowUp className="h-4 w-4" /></button>
                      </div>
                    </>
                  )}
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}
