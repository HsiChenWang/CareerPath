import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUp, Inbox } from "lucide-react";
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  getGetConversationsQueryKey,
  getGetMessagesQueryKey,
  getGetNetworkQueryKey,
} from "@workspace/api-client-react";
import { AiThinking, EmptyBlock, ErrorBlock, PersonAvatar } from "@/components/bits";
import { SafetyMenu } from "@/components/safety";
import { useCoach } from "@/components/coach";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { errMsg, fmtShort, fmtTime, roleLine, useMe } from "@/lib/cp";
import { cn } from "@/lib/utils";

export function MessageSession() {
  const { user } = useMe();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { setFocus } = useCoach();
  const conversations = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 3000 },
  });
  const [active, setActive] = useState("");
  const [text, setText] = useState("");
  const didAutoSelect = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = useGetMessages(active, {
    query: { enabled: !!active, queryKey: getGetMessagesQueryKey(active), refetchInterval: 3000 },
  });
  const send = useSendMessage();
  const list = conversations.data ?? [];
  const conversation = list.find((item) => item.id === active);

  useEffect(() => {
    if (!didAutoSelect.current && !conversations.isLoading && list.length) {
      didAutoSelect.current = true;
      setActive(list[0]!.id);
    }
  }, [conversations.isLoading, list]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length, active]);

  useEffect(() => {
    setText("");
  }, [active]);

  useEffect(() => {
    if (conversation) setFocus({ personId: conversation.person.id, label: conversation.person.name });
    return () => setFocus({});
  }, [conversation?.person.id, conversation?.person.name, setFocus]);

  const onSend = () => {
    if (!text.trim() || !active) return;
    send.mutate({ id: active, data: { text: text.trim() } }, {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: getGetMessagesQueryKey(active) });
        qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
      },
      onError: (error) => toast({ title: "Not sent", description: errMsg(error), variant: "destructive" }),
    });
  };

  return (
    <div className="grid h-[620px] min-h-[480px] overflow-hidden rounded-[1.75rem] border bg-card shadow-sm md:grid-cols-[300px_1fr]" data-testid="panel-message-session">
      <aside className={cn("flex min-h-0 flex-col border-r", active && "hidden md:flex")}>
        <div className="border-b px-4 py-3">
          <p className="font-semibold">Conversations</p>
          <p className="text-xs text-muted-foreground">Messages with your Trojan network</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversations.isLoading ? [0, 1, 2].map((index) => <Skeleton key={index} className="m-2 h-16 rounded-2xl" />) : conversations.isError ? (
            <ErrorBlock message={errMsg(conversations.error)} onRetry={() => conversations.refetch()} />
          ) : !list.length ? (
            <div className="p-5 text-center text-sm text-muted-foreground">
              No conversations yet. <Link href="/connect" className="font-semibold text-cardinal underline underline-offset-2">Find a Trojan</Link> to start one.
            </div>
          ) : list.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn("flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors", active === item.id ? "bg-gold-soft" : "hover:bg-muted")}
              data-testid={`button-session-conversation-${item.id}`}
            >
              <PersonAvatar person={item.person} size={44} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">{item.person.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{fmtShort(item.updatedAt)}</span>
                </span>
                <span className="block truncate text-sm text-muted-foreground">{item.blocked ? "Conversation unavailable" : item.lastMessage || "No messages yet"}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className={cn("flex min-h-0 flex-col", !active && "hidden md:flex")}>
        {!active || !conversation ? (
          <div className="grid flex-1 place-items-center p-8">
            <EmptyBlock icon={<Inbox className="h-6 w-6" />} title="Pick a conversation" body="Your chat session will appear here." />
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <button type="button" onClick={() => setActive("")} className="rounded-full p-1.5 hover:bg-muted md:hidden" aria-label="Back to conversations" data-testid="button-session-back"><ArrowLeft className="h-4 w-4" /></button>
              <Link href={`/people/${conversation.person.id}`} className="flex min-w-0 flex-1 items-center gap-3" data-testid="link-session-person">
                <PersonAvatar person={conversation.person} size={40} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{conversation.person.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{roleLine(conversation.person)}</span>
                </span>
              </Link>
              <SafetyMenu personId={conversation.person.id} name={conversation.person.name} blocked={conversation.blocked} />
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-paper/60 px-4 py-5">
              {messages.isLoading ? <Skeleton className="h-20 w-2/3 rounded-2xl" /> : messages.isError ? (
                <ErrorBlock message={errMsg(messages.error)} onRetry={() => messages.refetch()} />
              ) : (messages.data ?? []).map((message) => {
                const mine = message.senderId === user?.id;
                return (
                  <div key={message.id} className={cn("rise flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[82%] rounded-2xl px-4 py-2.5", mine ? "rounded-br-md bg-cardinal text-white" : "rounded-bl-md border bg-card")} data-testid={`text-session-message-${message.id}`}>
                      <p className="whitespace-pre-wrap text-[15px]">{message.text}</p>
                      <p className={cn("mt-1 text-right font-mono text-[10px]", mine ? "text-white/60" : "text-muted-foreground")}>{fmtTime(message.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <footer className="border-t p-3">
              {conversation.blocked ? <p className="p-3 text-center text-sm text-muted-foreground">This conversation is blocked.</p> : !conversation.canSend ? (
                <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink">Your first message is on its way. You can write again once {conversation.person.name.split(" ")[0]} replies.</p>
              ) : (
                <>
                  {send.isPending && <AiThinking label="Sending your message..." className="mb-2" />}
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }}
                      rows={1}
                      placeholder="Write a message..."
                      className="min-h-11 resize-none rounded-2xl bg-paper"
                      data-testid="input-session-message"
                    />
                    <button type="button" onClick={onSend} disabled={!text.trim() || send.isPending} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cardinal text-white transition-transform active:scale-90 disabled:opacity-40" aria-label="Send message" data-testid="button-session-send"><ArrowUp className="h-4 w-4" /></button>
                  </div>
                </>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
