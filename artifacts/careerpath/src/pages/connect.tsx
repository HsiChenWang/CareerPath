import { useDeferredValue, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Coffee, MessageSquare, PenLine, Search, Users } from "lucide-react";
import { useGetPeople, useStartConversation, getGetConversationsQueryKey } from "@workspace/api-client-react";
import type { Person } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, CardSkeletons, EmptyBlock, ErrorBlock, PageHeader, PersonAvatar, Tag } from "@/components/bits";
import { Composer } from "@/components/composer";
import { CoffeeRequest } from "@/components/coffee-request";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { errMsg, roleLine, SCHOOLS } from "@/lib/cp";
import { cn } from "@/lib/utils";

export function PersonActions({ person }: { person: Person }) {
  const [draft, setDraft] = useState(false);
  const [coffee, setCoffee] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const start = useStartConversation();
  const alum = person.role === "alumni";
  const messagePeer = () =>
    start.mutate({ data: { personId: person.id } }, {
      onSuccess: (c) => { qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() }); setLocation(`/messages?c=${c.id}`); },
      onError: (e) => toast({ title: "Could not open chat", description: errMsg(e), variant: "destructive" }),
    });
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setDraft(true)} className="inline-flex items-center gap-1.5 rounded-full bg-cardinal px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-95" data-testid={`button-draft-${person.id}`}><PenLine className="h-3.5 w-3.5" />Draft message</button>
      {alum ? (
        <button onClick={() => setCoffee(true)} disabled={person.openToChat === false || person.paused} className="inline-flex items-center gap-1.5 rounded-full border border-cardinal/30 bg-card px-4 py-2 text-sm font-semibold text-cardinal transition-colors hover:bg-gold-soft disabled:opacity-40" data-testid={`button-coffee-${person.id}`}><Coffee className="h-3.5 w-3.5" />Request coffee chat</button>
      ) : (
        <button onClick={messagePeer} disabled={start.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-cardinal/30 bg-card px-4 py-2 text-sm font-semibold text-cardinal hover:bg-gold-soft" data-testid={`button-message-${person.id}`}><MessageSquare className="h-3.5 w-3.5" />Message</button>
      )}
      <Composer person={person} open={draft} onOpenChange={setDraft} />
      {alum && <CoffeeRequest person={person} open={coffee} onOpenChange={setCoffee} />}
    </div>
  );
}

export default function Connect() {
  const [tab, setTab] = useState<"alumni" | "peers">("alumni");
  const [search, setSearch] = useState("");
  const [school, setSchool] = useState("all");
  const [company, setCompany] = useState("");
  const dSearch = useDeferredValue(search.trim());
  const dCompany = useDeferredValue(company.trim());
  const params = { kind: tab, ...(dSearch ? { search: dSearch } : {}), ...(school !== "all" ? { school } : {}), ...(dCompany && tab === "alumni" ? { company: dCompany } : {}) };
  const q = useGetPeople(params);

  return (
    <Page>
      <PageHeader eyebrow="Connect" title={<>The right Trojans, <span className="text-cardinal">in the right order.</span></>} sub="Ranked by your dream role and company first, then shared clubs, major, school and background.">
        <div className="inline-flex rounded-full border bg-card p-1">
          {(["alumni", "peers"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-5 py-2 text-sm font-semibold transition-all", tab === t ? "bg-cardinal text-white" : "text-muted-foreground hover:text-foreground")} data-testid={`tab-${t}`}>{t === "alumni" ? "Alumni" : "Peers"}</button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-8 grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <div className="flex items-center gap-2 rounded-2xl border bg-card px-4"><Search className="h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, role, club, skill..." className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0" data-testid="input-search-people" /></div>
        <Select value={school} onValueChange={setSchool}>
          <SelectTrigger className="h-12 rounded-2xl bg-card" data-testid="select-school"><SelectValue placeholder="School" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All schools</SelectItem>{SCHOOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={company} onChange={(e) => setCompany(e.target.value)} disabled={tab === "peers"} placeholder="Company" className="h-12 rounded-2xl bg-card" data-testid="input-company-filter" />
      </div>

      {q.isLoading ? (
        <div className="space-y-6"><AiThinking label={tab === "alumni" ? "Ranking Trojans by fit..." : "Finding classmates on your track..."} className="max-w-sm" /><CardSkeletons n={4} h={240} /></div>
      ) : q.isError ? (
        <ErrorBlock message={errMsg(q.error)} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyBlock icon={<Users className="h-6 w-6" />} title="Nobody matches that yet" body="Loosen a filter or try a different keyword." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {q.data.map((p, i) => (
            <article key={p.id} className="lift rise relative rounded-[1.75rem] border bg-card p-6" style={{ animationDelay: `${i * 60}ms` }} data-testid={`card-person-${p.id}`}>
              {tab === "alumni" && i < 5 && <span className="absolute right-5 top-5 font-display text-4xl text-cardinal/15">#{i + 1}</span>}
              <div className="flex items-start gap-4">
                <PersonAvatar person={p} size={56} />
                <div className="min-w-0 flex-1 pr-10">
                  <Link href={`/people/${p.id}`} className="font-display text-xl hover:text-cardinal" data-testid={`link-person-${p.id}`}>{p.name}</Link>
                  <p className="text-sm text-muted-foreground">{roleLine(p)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Tag>{p.school}{p.gradYear ? ` '${String(p.gradYear).slice(-2)}` : ""}</Tag>
                    {p.role === "alumni" && p.openToChat && !p.paused && <Tag tone="gold">Open to coffee chats</Tag>}
                    {typeof p.fitScore === "number" && <Tag tone="cardinal">{Math.round(p.fitScore)}% fit</Tag>}
                  </div>
                </div>
              </div>
              {p.fitReason && (
                <div className="mt-5 border-l-4 border-gold pl-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cardinal">{tab === "alumni" ? "Why this person" : "AI suggestion"}</p>
                  <p className="mt-1 text-sm" data-testid={`text-fit-${p.id}`}>{p.fitReason}</p>
                </div>
              )}
              {tab === "peers" && !!p.clubs.length && <p className="mt-3 text-xs text-muted-foreground">Clubs: {p.clubs.slice(0, 3).join(", ")}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link href={`/people/${p.id}`} className="rounded-full px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted" data-testid={`button-view-${p.id}`}>View profile</Link>
                <PersonActions person={p} />
              </div>
            </article>
          ))}
        </div>
      )}
    </Page>
  );
}
