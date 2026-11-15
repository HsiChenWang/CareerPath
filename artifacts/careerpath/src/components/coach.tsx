import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useAskAi } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { AiThinking } from "@/components/bits";
import { useMe, errMsg } from "@/lib/cp";
import { cn } from "@/lib/utils";

type Focus = { personId?: string; goal?: string; label?: string };
type Ctx = { ask: (prompt: string) => void; setFocus: (f: Focus) => void };
const CoachCtx = createContext<Ctx>({ ask: () => {}, setFocus: () => {} });
export const useCoach = () => useContext(CoachCtx);

type Msg = { role: "user" | "ai"; text: string; suggestions?: string[]; actions?: string[]; fallback?: boolean };

const PROMPTS: Record<string, string[]> = {
  "/explore": ["Which of these paths fits me best?", "How do I explore careers without committing yet?", "What should I do this semester?"],
  "/path-finder": ["What should I do this semester to stay on this path?", "Which step matters most?", "Is it too late to start this path?"],
  "/my-gap": ["Which gap should I close first?", "Help me find a club for this path", "What should I do this semester?"],
  "/connect": ["Who should I reach out to first?", "How do I ask an alum for a coffee chat?", "How do I message a peer without being awkward?"],
  "/people": ["How do I ask this alum for a coffee chat?", "What do we have in common?", "What should I avoid asking them?"],
  "/messages": ["How do I reply without sounding stiff?", "When is it okay to ask for a referral?", "How long should I wait before a nudge?"],
  "/my-network": ["What should I say in my follow-up?", "Who should I update this week?", "How do I keep a relationship warm?"],
  "/upcoming-chats": ["How do I prepare for my coffee chat?", "What is a great closing question?", "What should I send after the chat?"],
  "/profile": ["How can I make my profile stronger?", "What skills should I list?", "How should I describe my research?"],
  "/requests": ["Summarize who is asking me for time", "How do I decline kindly?", "What topics are students asking about?"],
};

function promptsFor(path: string, alumni: boolean): string[] {
  const key = Object.keys(PROMPTS).find((k) => path === k || path.startsWith(k + "/"));
  if (key) return PROMPTS[key];
  return alumni ? PROMPTS["/requests"] : PROMPTS["/explore"];
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const { user } = useMe();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<Focus>({});
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const askAi = useAskAi();
  const mutateRef = useRef(askAi.mutate);
  mutateRef.current = askAi.mutate;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const locRef = useRef(location);
  locRef.current = location;
  const endRef = useRef<HTMLDivElement>(null);

  const send = useCallback((prompt: string) => {
    const p = prompt.trim();
    if (!p) return;
    setMsgs((m) => [...m, { role: "user", text: p }]);
    setInput("");
    const f = focusRef.current;
    mutateRef.current(
      { data: { kind: "coach", prompt: p, page: locRef.current, personId: f.personId, goal: f.goal } },
      {
        onSuccess: (r) => setMsgs((m) => [...m, { role: "ai", text: r.text, suggestions: r.suggestions, actions: r.actions, fallback: r.fallback }]),
        onError: (e) => setMsgs((m) => [...m, { role: "ai", text: `I could not reach my notes just now (${errMsg(e)}). Ask again in a moment.`, fallback: true }]),
      },
    );
  }, []);

  const ask = useCallback((prompt: string) => {
    setOpen(true);
    send(prompt);
  }, [send]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, askAi.isPending]);

  const prompts = promptsFor(location, user?.role === "alumni");

  return (
    <CoachCtx.Provider value={{ ask, setFocus }}>
      {children}
      {user && (
        <>
          <button
            onClick={() => setOpen(true)}
            className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-cardinal py-3 pl-3 pr-5 text-sm font-semibold text-white shadow-xl transition-transform hover:-translate-y-0.5 active:scale-95"
            data-testid="button-open-coach"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-cardinal transition-transform group-hover:rotate-12">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Ask NextStepSC AI</span>
            <span className="sm:hidden">Ask AI</span>
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 border-l-0 bg-paper p-0 sm:max-w-md [&>button]:hidden">
              <div className="relative overflow-hidden bg-cardinal px-6 pb-6 pt-6 text-white">
                <div className="trail-h absolute bottom-0 left-0 right-0 h-1 opacity-80" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">Your career coach</p>
                    <SheetTitle className="mt-1 font-display text-2xl text-white">Ask NextStepSC AI</SheetTitle>
                    <SheetDescription className="mt-1 text-sm text-white/75">
                      {focus.label ? `Looking at ${focus.label} with you.` : `Knows your profile and this page.`}
                    </SheetDescription>
                  </div>
                  <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" data-testid="button-close-coach" aria-label="Close coach">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {msgs.length === 0 && (
                  <div className="rise">
                    <p className="font-display text-xl">Fight on. What is on your mind?</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try one of these, or ask anything.</p>
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={cn("rise flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "rounded-br-md bg-cardinal text-white" : "rounded-bl-md border bg-card")} data-testid={`text-coach-${m.role}-${i}`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      {!!m.actions?.length && (
                        <ul className="mt-3 space-y-1.5">
                          {m.actions.map((a, j) => (
                            <li key={j} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{a}</li>
                          ))}
                        </ul>
                      )}
                      {!!m.suggestions?.length && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.suggestions.map((s, j) => (
                            <button key={j} onClick={() => send(s)} className="rounded-full border border-cardinal/20 bg-gold-soft px-3 py-1 text-left text-xs text-ink hover:border-cardinal" data-testid={`button-coach-followup-${j}`}>{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {askAi.isPending && <AiThinking label="Thinking it through with you..." />}
                <div ref={endRef} />
              </div>
              <div className="border-t bg-card px-4 pb-4 pt-3">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {prompts.map((p, i) => (
                    <button key={p} onClick={() => send(p)} className="shrink-0 rounded-full border bg-paper px-3 py-1.5 text-xs font-medium transition-colors hover:border-cardinal hover:text-cardinal" data-testid={`button-coach-prompt-${i}`}>{p}</button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                    rows={1}
                    placeholder="Ask about your next step..."
                    className="min-h-11 resize-none rounded-2xl bg-paper"
                    data-testid="input-coach"
                  />
                  <button type="submit" disabled={!input.trim() || askAi.isPending} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cardinal text-white transition-transform active:scale-90 disabled:opacity-40" data-testid="button-coach-send" aria-label="Send">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </CoachCtx.Provider>
  );
}
