import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Minimize2, Pencil, RefreshCw, Send, Sparkles, Heart } from "lucide-react";
import {
  useAskAi, useGetConversations, useSendMessage, useStartConversation,
  getGetConversationsQueryKey, getGetNetworkQueryKey,
} from "@workspace/api-client-react";
import type { Person } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiThinking, FallbackNote, PersonAvatar } from "@/components/bits";
import { useToast } from "@/hooks/use-toast";
import { errMsg, roleLine } from "@/lib/cp";
import { cn } from "@/lib/utils";

const TONES = [["short", "Short"], ["warm", "Warm"], ["professional", "Professional"]] as const;

export function Composer({ person, open, onOpenChange }: { person: Person; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const convos = useGetConversations({ query: { enabled: open, queryKey: getGetConversationsQueryKey() } });
  const convo = convos.data?.find((c) => c.person.id === person.id);
  const isAlum = person.role === "alumni";
  const goals = isAlum
    ? [["advice", "Ask for advice"], ["coffee", "Request a coffee chat"], ["path", "Ask about their path"], ...(convo?.hasReply ? [["referral", "Ask about a referral"]] : [])]
    : [["advice", "Swap advice"], ["practice", "Practice together"], ["path", "Compare paths"]];
  const [goal, setGoal] = useState<string>(goals[0][0]);
  const [tone, setTone] = useState<string>("warm");
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [fallback, setFallback] = useState(false);
  const askAi = useAskAi();
  const start = useStartConversation();
  const send = useSendMessage();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const blockedBySpam = !!convo && !convo.canSend;

  const draft = (prompt?: string) => {
    askAi.mutate(
      { data: { kind: "draft", personId: person.id, goal, tone, prompt, text: prompt ? text : undefined } },
      {
        onSuccess: (r) => { setText(r.text); setFallback(r.fallback); setEditing(false); },
        onError: (e) => toast({ title: "Draft did not come through", description: errMsg(e), variant: "destructive" }),
      },
    );
  };

  const deliver = (conversationId: string) => {
    send.mutate(
      { id: conversationId, data: { text: text.trim() } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
          toast({ title: `Sent to ${person.name.split(" ")[0]}`, description: "You will see their reply in Messages." });
          onOpenChange(false);
          setLocation(`/messages?c=${conversationId}`);
        },
        onError: (e) => toast({ title: "Message not sent", description: errMsg(e), variant: "destructive" }),
      },
    );
  };

  const onSend = () => {
    if (!text.trim()) return;
    if (convo) return deliver(convo.id);
    start.mutate({ data: { personId: person.id } }, {
      onSuccess: (c) => deliver(c.id),
      onError: (e) => toast({ title: "Could not start the conversation", description: errMsg(e), variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl border-0 bg-paper p-0 sm:max-w-xl">
        <div className="flex items-center gap-4 rounded-t-3xl bg-card px-6 py-5">
          <PersonAvatar person={person} size={48} />
          <div className="min-w-0">
            <DialogTitle className="font-display text-xl">Write to {person.name}</DialogTitle>
            <DialogDescription className="truncate text-sm">{roleLine(person)}</DialogDescription>
          </div>
        </div>
        <div className="space-y-5 px-6 pb-6 pt-5">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">What is the ask</p>
            <div className="flex flex-wrap gap-2">
              {goals.map(([v, l]) => (
                <button key={v} onClick={() => setGoal(v)} className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-all active:scale-95", goal === v ? "border-cardinal bg-cardinal text-white" : "bg-card hover:border-cardinal/50")} data-testid={`button-goal-${v}`}>{l}</button>
              ))}
            </div>
            {isAlum && !convo?.hasReply && <p className="mt-2 text-xs text-muted-foreground">Referral asks unlock after {person.name.split(" ")[0]} replies to you. Relationship first.</p>}
          </div>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Tone</p>
            <div className="inline-flex rounded-full border bg-card p-1">
              {TONES.map(([v, l]) => (
                <button key={v} onClick={() => setTone(v)} className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", tone === v ? "bg-gold font-semibold text-ink" : "text-muted-foreground hover:text-foreground")} data-testid={`button-tone-${v}`}>{l}</button>
              ))}
            </div>
          </div>

          {askAi.isPending ? (
            <AiThinking label="Finding what you two share..." />
          ) : text ? (
            <div>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} readOnly={!editing} rows={7} className={cn("rounded-2xl bg-card text-[15px] leading-relaxed", !editing && "cursor-default focus-visible:ring-0")} data-testid="input-draft" />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{editing ? "Editing manually" : "AI draft. Review before sending."}</span>
                <span className={cn(words > 120 && "font-semibold text-destructive")} data-testid="text-word-count">{words} / 120 words</span>
              </div>
              <FallbackNote show={fallback} />
            </div>
          ) : (
            <button onClick={() => draft()} className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cardinal/30 bg-card py-8 font-medium text-cardinal transition-colors hover:border-cardinal hover:bg-gold-soft/40" data-testid="button-generate-draft">
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" /> Draft it with AI
            </button>
          )}

          {text && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => draft()} disabled={askAi.isPending} data-testid="button-regenerate"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Regenerate</Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => draft("Make it shorter")} disabled={askAi.isPending} data-testid="button-shorten"><Minimize2 className="mr-1.5 h-3.5 w-3.5" />Make it shorter</Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => draft("Make it more personal using specific shared details")} disabled={askAi.isPending} data-testid="button-personalize"><Heart className="mr-1.5 h-3.5 w-3.5" />More personal</Button>
              <Button size="sm" variant={editing ? "secondary" : "outline"} className="rounded-full" onClick={() => setEditing((e) => !e)} data-testid="button-edit-manually"><Pencil className="mr-1.5 h-3.5 w-3.5" />{editing ? "Done editing" : "Edit manually"}</Button>
            </div>
          )}

          {blockedBySpam && (
            <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink" data-testid="text-anti-spam">
              You already sent {person.name.split(" ")[0]} a first message. To keep things respectful, you can write again once they reply.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)} data-testid="button-cancel-draft">Cancel</Button>
            <Button className="rounded-full px-6" onClick={onSend} disabled={!text.trim() || blockedBySpam || start.isPending || send.isPending || words > 160} data-testid="button-send-draft">
              <Send className="mr-2 h-4 w-4" /> {start.isPending || send.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
