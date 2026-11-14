import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Coffee, MapPin, Sparkles, Video } from "lucide-react";
import { useAskAi, useRequestChat, getGetChatsQueryKey, getGetNetworkQueryKey } from "@workspace/api-client-react";
import type { Person } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiThinking, FallbackNote } from "@/components/bits";
import { useToast } from "@/hooks/use-toast";
import { errMsg, fmtTime } from "@/lib/cp";
import { cn } from "@/lib/utils";

export function CoffeeRequest({ person, open, onOpenChange }: { person: Person; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [duration, setDuration] = useState<15 | 30>(15);
  const [format, setFormat] = useState<"virtual" | "campus">("virtual");
  const [times, setTimes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [fallback, setFallback] = useState(false);
  const askAi = useAskAi();
  const request = useRequestChat();
  const slots = (person.availability ?? []).filter((t) => { const d = new Date(t); return isNaN(d.getTime()) || d.getTime() > Date.now(); });
  const first = person.name.split(" ")[0];

  const toggle = (t: string) =>
    setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= 3 ? cur : [...cur, t]));

  const writeNote = () =>
    askAi.mutate(
      { data: { kind: "draft", personId: person.id, goal: "coffee", tone: "warm", prompt: `Short coffee chat request note for a ${duration} minute ${format === "virtual" ? "video call" : "on-campus coffee"}` } },
      { onSuccess: (r) => { setNote(r.text); setFallback(r.fallback); }, onError: (e) => toast({ title: "No note this time", description: errMsg(e), variant: "destructive" }) },
    );

  const submit = () =>
    request.mutate(
      { data: { alumniId: person.id, duration, format, times, note: note.trim() } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetChatsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetNetworkQueryKey() });
          toast({ title: "Request sent", description: `${first} will pick a time or suggest another.` });
          onOpenChange(false);
          setLocation("/upcoming-chats");
        },
        onError: (e) => toast({ title: "Request not sent", description: errMsg(e), variant: "destructive" }),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl border-0 bg-paper p-0 sm:max-w-xl">
        <div className="relative overflow-hidden rounded-t-3xl bg-cardinal px-6 py-6 text-white">
          <Coffee className="absolute -right-4 -top-4 h-28 w-28 text-white/10" />
          <DialogTitle className="font-display text-2xl text-white">Coffee with {first}</DialogTitle>
          <DialogDescription className="mt-1 text-white/75">Short, specific, and easy to say yes to.</DialogDescription>
        </div>
        <div className="space-y-6 px-6 pb-6 pt-5">
          <div className="grid grid-cols-2 gap-3">
            {([15, 30] as const).map((d) => (
              <button key={d} onClick={() => setDuration(d)} className={cn("rounded-2xl border-2 p-4 text-left transition-all active:scale-[.98]", duration === d ? "border-cardinal bg-card shadow-sm" : "border-transparent bg-muted/60")} data-testid={`button-duration-${d}`}>
                <p className="font-display text-3xl">{d}<span className="text-base"> min</span></p>
                <p className="text-xs text-muted-foreground">{d === 15 ? "A quick hello" : "A real conversation"}</p>
              </button>
            ))}
            {([["virtual", "Virtual", Video], ["campus", "On campus", MapPin]] as const).map(([v, l, Icon]) => (
              <button key={v} onClick={() => setFormat(v)} className={cn("flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[.98]", format === v ? "border-cardinal bg-card shadow-sm" : "border-transparent bg-muted/60")} data-testid={`button-format-${v}`}>
                <Icon className="h-5 w-5 text-cardinal" /> <span className="font-medium">{l}</span>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Pick up to 3 times from {first}'s availability</p>
              <span className="font-mono text-xs text-cardinal" data-testid="text-times-count">{times.length}/3</span>
            </div>
            {slots.length === 0 && <p className="mb-2 text-sm text-muted-foreground">{first} has not posted slots yet. Try messaging them instead.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((t, i) => {
                const on = times.includes(t);
                return (
                  <button key={t} onClick={() => toggle(t)} disabled={!on && times.length >= 3} className={cn("flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all disabled:opacity-40", on ? "border-cardinal bg-cardinal/5 font-medium text-cardinal" : "bg-card hover:border-cardinal/40")} data-testid={`button-time-${i}`}>
                    {fmtTime(t)}
                    <span className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-cardinal bg-cardinal text-white" : "")}>{on && <Check className="h-3 w-3" />}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Your note</p>
              <button onClick={writeNote} disabled={askAi.isPending} className="flex items-center gap-1.5 text-sm font-medium text-cardinal hover:underline disabled:opacity-50" data-testid="button-ai-note"><Sparkles className="h-3.5 w-3.5" />{note ? "Rewrite with AI" : "Draft with AI"}</button>
            </div>
            {askAi.isPending ? <AiThinking label="Writing a note they will want to answer..." /> : (
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder={`Why ${first}, and what you hope to learn.`} className="rounded-2xl bg-card" data-testid="input-chat-note" />
            )}
            <FallbackNote show={fallback} />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)} data-testid="button-cancel-request">Cancel</Button>
            <Button className="rounded-full px-6" onClick={submit} disabled={!times.length || !note.trim() || request.isPending} data-testid="button-submit-request">
              {request.isPending ? "Sending..." : "Send request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
