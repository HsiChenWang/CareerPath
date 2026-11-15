import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, FastForward, Sparkles } from "lucide-react";
import {
  useAdvanceTime, useAskAi, useGetNetwork, getGetNetworkQueryKey, getGetChatsQueryKey,
} from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, CardSkeletons, ErrorBlock, PageHeader, PersonAvatar, Tag } from "@/components/bits";
import { MessageSession } from "@/components/message-session";
import { useToast } from "@/hooks/use-toast";
import { errMsg, fmtShort, fmtTime, useMe } from "@/lib/cp";

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
  const fallbackSuggestions = [
    ...(upcoming[0] ? [`Prepare a question for your coffee chat with ${upcoming[0].person.name.split(" ")[0]}.`] : []),
    ...(n?.followups[0] ? [`Follow up with ${n.followups[0].person.name.split(" ")[0]} about your ${n.followups[0].kind}.`] : []),
  ];
  if (!fallbackSuggestions.length) fallbackSuggestions.push("Make a coffee chat with a Trojan in a role you want to explore.");
  const weeklySuggestions = weekly.data?.actions.filter((action) => action.trim()).slice(0, 3) ?? [];
  const followup = n?.followups[0];
  const followupSuggestion = followup
    ? `Follow up with ${followup.person.name.split(" ")[0]} about your ${followup.kind}.`
    : undefined;
  const followupFirstName = followup?.person.name.split(" ")[0]?.toLowerCase();
  const followupAlreadySuggested = Boolean(followupFirstName && weeklySuggestions.some((suggestion) =>
    suggestion.toLowerCase().includes(followupFirstName)
    && /(follow up|check in|message|reply)/i.test(suggestion),
  ));
  const visibleSuggestions = weeklySuggestions.length
    ? [
        ...weeklySuggestions.slice(0, followupSuggestion && !followupAlreadySuggested ? 2 : 3),
        ...(followupSuggestion && !followupAlreadySuggested ? [followupSuggestion] : []),
      ]
    : fallbackSuggestions;

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
      {q.isLoading ? <div className="space-y-5"><AiThinking label="Loading your network..." className="max-w-md" /><CardSkeletons n={3} /></div> : q.isError || !n ? <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} /> : (
        <div className="space-y-10">
          <div className="rise grid gap-5 overflow-hidden rounded-[2rem] bg-cardinal p-5 text-white shadow-lg md:p-7 lg:grid-cols-[1.1fr_.9fr]">
            <section className="flex flex-col">
              <h2 className="font-display text-2xl text-gold">Weekly Suggestion</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/90" data-testid="list-weekly-suggestions">
                {visibleSuggestions.map((suggestion, index) => (
                  <li key={`${suggestion}-${index}`} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              {weekly.isPending && <AiThinking label="Finding your next steps..." className="mt-4 text-white" />}
              <button onClick={() => weekly.mutate({ data: { kind: "weekly" } })} disabled={weekly.isPending} className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 disabled:opacity-60" data-testid="button-weekly-coach"><Sparkles className="h-3.5 w-3.5" />{weekly.isPending ? "Thinking..." : "Refresh suggestions"}</button>
            </section>

            <section className="rounded-[1.5rem] bg-paper p-5 text-ink" aria-labelledby="upcoming-coffee-title" data-testid="panel-upcoming-coffee">
              <h2 id="upcoming-coffee-title" className="flex items-center gap-2 font-display text-xl"><CalendarDays className="h-5 w-5 text-cardinal" />Upcoming coffee chat</h2>
              {upcoming.length ? (
                <div className="mt-3 space-y-2">
                  {upcoming.slice(0, 3).map((chat) => (
                    <Link key={chat.id} href="/schedule" className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white" data-testid={`link-upcoming-${chat.id}`}>
                      <PersonAvatar person={chat.person} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{chat.person.name}</span>
                        <span className="block text-xs text-muted-foreground">{fmtShort(chat.scheduledAt)} · {fmtTime(chat.scheduledAt)}</span>
                      </span>
                      <Tag tone="gold">Scheduled</Tag>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-white/70 p-3">
                  <p className="text-sm text-muted-foreground">No coffee chats scheduled yet.</p>
                  <Link href="/connect" className="mt-2 inline-block text-sm font-semibold text-cardinal hover:underline">Find a Trojan to meet</Link>
                </div>
              )}
            </section>
          </div>

          <section aria-labelledby="chat-session-title">
            <div className="mb-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cardinal">Your inbox</p>
              <h2 id="chat-session-title" className="mt-1 font-display text-2xl">Chat session</h2>
            </div>
            <MessageSession />
          </section>
        </div>
      )}
    </Page>
  );
}
