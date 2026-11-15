import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Sparkles, UploadCloud, Wand2, X } from "lucide-react";
import { useAskAi, useSaveProfile, useUploadResume, getGetSessionQueryKey, getGetGapQueryKey, getGetPeopleQueryKey } from "@workspace/api-client-react";
import type { AiResult, ProfileInput, Session } from "@workspace/api-client-react";
import { Page } from "@/components/shell";
import { AiThinking, PageHeader, TagInput } from "@/components/bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { errMsg, useMe, isProfileComplete, LEVELS, SCHOOLS, PATH_KEY } from "@/lib/cp";
import { cn } from "@/lib/utils";

const KEYS: (keyof ProfileInput)[] = ["name", "school", "major", "level", "year", "gradYear", "clubs", "experience", "skills", "courses", "interests", "dreamRole", "dreamCompany", "currentRole", "company", "openToChat", "paused", "helpTopics", "availability", "maxChats", "bio"];
const LIST_KEYS = ["clubs", "experience", "skills", "courses", "interests", "helpTopics", "availability"] as const;

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="space-y-1.5"><Label className="text-sm font-semibold">{label}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}

function Card({ title, eyebrow, children, className }: { title: string; eyebrow: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rise rounded-[1.75rem] border bg-card p-6 md:p-8", className)}>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cardinal">{eyebrow}</p>
      <h2 className="mb-6 mt-1 font-display text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function Profile() {
  const { user } = useMe();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const welcome = new URLSearchParams(useSearch()).get("welcome") === "1" || !isProfileComplete(user);
  const [form, setForm] = useState<ProfileInput>({});
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [resume, setResume] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [knows, setKnows] = useState<"yes" | "no" | "">("");
  const init = useRef<string | null>(null);
  const resumeFileInput = useRef<HTMLInputElement>(null);
  const save = useSaveProfile();
  const resumeAi = useAskAi();
  const resumeUploadAi = useUploadResume();
  const tips = useAskAi();
  const alum = user?.role === "alumni";

  useEffect(() => {
    if (user && init.current !== user.id) {
      init.current = user.id;
      const f: ProfileInput = {};
      for (const k of KEYS) {
        const v = (user as unknown as Record<string, unknown>)[k];
        if (v !== undefined && v !== null) (f as Record<string, unknown>)[k] = v;
      }
      setForm(f);
      if (user.dreamRole) setKnows("yes");
    }
  }, [user]);

  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const list = (k: (typeof LIST_KEYS)[number]) => (form[k] as string[] | undefined) ?? [];

  const applyResumeProfile = (r: AiResult) => {
    if (r.fallback) {
      toast({ title: "Resume autofill is temporarily unavailable", description: r.text });
      return false;
    }
    if (!r.profile) { toast({ title: "Nothing to extract", description: "Try another resume or paste its text instead." }); return false; }
    const got = new Set<string>();
    setForm((f) => {
      const next = { ...f } as Record<string, unknown>;
      for (const [k, v] of Object.entries(r.profile ?? {})) {
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
        if (Array.isArray(v) && Array.isArray(next[k])) next[k] = Array.from(new Set([...(next[k] as string[]), ...v]));
        else next[k] = v;
        got.add(k);
      }
      return next as ProfileInput;
    });
    if (!got.size) {
      toast({ title: "No profile details found", description: "Try another resume or paste its text instead." });
      return false;
    }
    setFilled(got);
    toast({ title: `Filled ${got.size} fields`, description: "Highlighted in gold. Review before saving." });
    return true;
  };

  const autofill = () => resumeAi.mutate({ data: { kind: "resume", text: resume } }, {
    onSuccess: applyResumeProfile,
    onError: (e) => toast({ title: "Resume reader is resting", description: errMsg(e), variant: "destructive" }),
  });

  const chooseResume = (file?: File) => {
    if (resumeUploadAi.isPending || resumeAi.isPending) return;
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(extension ?? "")) {
      toast({ title: "Choose a supported file", description: "Upload a PDF, DOCX, or plain-text resume.", variant: "destructive" });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "File is too large", description: "Your resume must be 4 MB or smaller.", variant: "destructive" });
      return;
    }
    setResumeFile(file);
  };

  const uploadResume = () => {
    if (!resumeFile || resumeAi.isPending || resumeUploadAi.isPending) return;
    resumeUploadAi.mutate({ data: { file: resumeFile } }, {
      onSuccess: (r) => {
        if (applyResumeProfile(r)) {
          setResumeFile(null);
          if (resumeFileInput.current) resumeFileInput.current.value = "";
        }
      },
      onError: (e) => toast({ title: "Could not read that resume", description: errMsg(e), variant: "destructive" }),
    });
  };

  const submit = (next?: string) => {
    const draftReady = isProfileComplete({ ...user, ...form });
    if (welcome && !draftReady) {
      toast({ title: "A few details are still needed", description: alum ? "Add your USC school, major, and current role to continue." : "Add your USC school, major, level, and year or graduation year to continue." });
      return;
    }
    const data: ProfileInput = {};
    for (const k of KEYS) {
      const v = form[k];
      if (v === undefined) continue;
      (data as Record<string, unknown>)[k] = v;
    }
    if (data.gradYear !== undefined) data.gradYear = Number(data.gradYear) || undefined;
    if (data.maxChats !== undefined) data.maxChats = Math.max(0, Math.min(30, Number(data.maxChats) || 0));
    if (!alum && knows === "no") { data.dreamRole = ""; data.dreamCompany = ""; }
    save.mutate({ data }, {
      onSuccess: (p) => {
        qc.setQueryData<Session>(getGetSessionQueryKey(), { user: p });
        qc.invalidateQueries({ queryKey: getGetGapQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPeopleQueryKey() });
        sessionStorage.removeItem(PATH_KEY);
        setFilled(new Set());
        toast({ title: "Profile saved" });
        const destination = next ?? (welcome ? (alum ? "/requests" : "/career-workflow") : undefined);
        if (destination) setLocation(destination);
        else tips.mutate({ data: { kind: "tips" } });
      },
      onError: (e) => toast({ title: "Not saved", description: errMsg(e), variant: "destructive" }),
    });
  };

  if (!user) return null;
  const hl = (k: string) => filled.has(k) && "ring-2 ring-gold/70";
  const draftReady = isProfileComplete({ ...user, ...form });

  return (
    <Page>
      <PageHeader eyebrow={welcome ? "Welcome, Trojan" : "Profile"} title={welcome ? <>Let's set up <span className="text-cardinal">your start line.</span></> : <>Your profile, <span className="text-cardinal">your starting point.</span></>} sub={alum ? "Students see your path and topics. Never your email or phone." : "The more we know about where you are, the better we can show you where Trojans like you went."} />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="rise relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-paper md:p-8">
            <FileText className="absolute -right-6 -top-6 h-36 w-36 text-white/5" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">Shortcut</p>
            <h2 className="mt-1 font-display text-2xl">Upload your resume. We will do the typing.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/70">Choose a PDF, DOCX, or plain-text file up to 4 MB. We remove email addresses and phone numbers before asking AI to suggest your profile details. CareerPath does not save your file; review every suggestion before saving.</p>
            <input
              ref={resumeFileInput}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="sr-only"
              disabled={resumeUploadAi.isPending || resumeAi.isPending}
              aria-label="Choose a PDF, DOCX, or plain-text resume"
              data-testid="input-resume-file"
              onChange={(e) => chooseResume(e.currentTarget.files?.[0])}
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (!resumeUploadAi.isPending && !resumeAi.isPending) chooseResume(e.dataTransfer.files?.[0]); }}
              className="mt-5 rounded-2xl border border-dashed border-gold/50 bg-white/[0.04] p-5 sm:p-6"
              data-testid="dropzone-resume"
            >
              {resumeFile ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold text-ink"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-paper" data-testid="text-resume-filename">{resumeFile.name}</p>
                    <p className="mt-0.5 text-xs text-paper/60">{(resumeFile.size / 1024).toFixed(0)} KB · Ready to extract</p>
                  </div>
                  <button type="button" disabled={resumeUploadAi.isPending} onClick={() => { setResumeFile(null); if (resumeFileInput.current) resumeFileInput.current.value = ""; }} className="rounded-full p-2 text-paper/70 hover:bg-white/10 hover:text-paper disabled:opacity-40" aria-label="Remove selected resume" data-testid="button-remove-resume"><X className="h-4 w-4" /></button>
                  <button type="button" onClick={uploadResume} disabled={resumeUploadAi.isPending} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50" data-testid="button-upload-resume"><UploadCloud className="h-4 w-4" />Extract profile details</button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gold text-ink"><UploadCloud className="h-5 w-5" /></span>
                  <p className="mt-3 text-sm font-semibold text-paper">Drag your resume here</p>
                  <p className="mt-1 text-xs text-paper/60">PDF, DOCX, or TXT · Up to 4 MB</p>
                  <button type="button" disabled={resumeUploadAi.isPending || resumeAi.isPending} onClick={() => resumeFileInput.current?.click()} className="mt-4 rounded-full border border-gold/50 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50" data-testid="button-choose-resume">Choose a file</button>
                </div>
              )}
            </div>
            {resumeUploadAi.isPending && <AiThinking label="Reading your resume and finding profile details..." className="mt-3" />}
            <details className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer text-sm font-medium text-paper/80">Prefer to paste your resume text?</summary>
              <Textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={5} placeholder="Paste the text of your resume here..." className="mt-4 rounded-2xl border-white/15 bg-white/5 text-paper placeholder:text-paper/40" data-testid="input-resume" />
              {resumeAi.isPending ? <AiThinking label="Reading your resume..." className="mt-3" /> : (
                <button onClick={autofill} disabled={resume.trim().length < 30 || resumeUploadAi.isPending || resumeAi.isPending} className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40" data-testid="button-autofill"><Wand2 className="h-4 w-4" />Autofill from pasted text</button>
              )}
            </details>
          </section>

          <Card eyebrow="Basics" title="Who you are">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Name"><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} className={cn("h-11 rounded-xl", hl("name"))} data-testid="input-name" /></Field>
              <Field label="USC school">
                <Select value={form.school || undefined} onValueChange={(v) => set("school", v)}>
                  <SelectTrigger className={cn("h-11 rounded-xl", hl("school"))} data-testid="select-school"><SelectValue placeholder="Choose school" /></SelectTrigger>
                  <SelectContent>{SCHOOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Major"><Input value={form.major ?? ""} onChange={(e) => set("major", e.target.value)} className={cn("h-11 rounded-xl", hl("major"))} data-testid="input-major" /></Field>
              <Field label="Level">
                <Select value={form.level || undefined} onValueChange={(v) => set("level", v)}>
                  <SelectTrigger className={cn("h-11 rounded-xl", hl("level"))} data-testid="select-level"><SelectValue placeholder="Choose level" /></SelectTrigger>
                  <SelectContent>{LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Year"><Input value={form.year ?? ""} onChange={(e) => set("year", e.target.value)} placeholder="Sophomore" className={cn("h-11 rounded-xl", hl("year"))} data-testid="input-year" /></Field>
              <Field label="Graduation year"><Input type="number" value={form.gradYear ?? ""} onChange={(e) => set("gradYear", e.target.value ? Number(e.target.value) : undefined)} className={cn("h-11 rounded-xl", hl("gradYear"))} data-testid="input-grad-year" /></Field>
            </div>
            <div className="mt-5"><Field label="Short bio"><Textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} rows={3} className={cn("rounded-xl", hl("bio"))} data-testid="input-bio" /></Field></div>
          </Card>

          <Card eyebrow="Experience" title="What you have done">
            <div className="space-y-5">
              <Field label="Clubs" hint="Press Enter after each."><TagInput value={list("clubs")} onChange={(v) => set("clubs", v)} testId="clubs" highlight={filled.has("clubs")} placeholder="Hack SC, Lavalab..." /></Field>
              <Field label="Internships and work experience"><TagInput value={list("experience")} onChange={(v) => set("experience", v)} testId="experience" highlight={filled.has("experience")} placeholder="Research assistant, ISI lab" /></Field>
              <Field label="Skills"><TagInput value={list("skills")} onChange={(v) => set("skills", v)} testId="skills" highlight={filled.has("skills")} placeholder="Python, Figma..." /></Field>
              <Field label="Relevant courses"><TagInput value={list("courses")} onChange={(v) => set("courses", v)} testId="courses" highlight={filled.has("courses")} placeholder="CSCI 201" /></Field>
              <Field label="Interests"><TagInput value={list("interests")} onChange={(v) => set("interests", v)} testId="interests" highlight={filled.has("interests")} placeholder="Climate tech, games..." /></Field>
            </div>
          </Card>

          {alum ? (
            <Card eyebrow="Alumni settings" title="How you want to help">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Current role"><Input value={form.currentRole ?? ""} onChange={(e) => set("currentRole", e.target.value)} className="h-11 rounded-xl" data-testid="input-current-role" /></Field>
                <Field label="Company"><Input value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} className="h-11 rounded-xl" data-testid="input-company" /></Field>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border bg-paper p-4"><span><span className="block font-semibold">Open to coffee chats</span><span className="text-xs text-muted-foreground">Show the badge to students</span></span><Switch checked={!!form.openToChat} onCheckedChange={(v) => set("openToChat", v)} data-testid="switch-open-to-chat" /></label>
                <label className="flex items-center justify-between rounded-2xl border bg-paper p-4"><span><span className="block font-semibold">Pause requests</span><span className="text-xs text-muted-foreground">Take a break anytime</span></span><Switch checked={!!form.paused} onCheckedChange={(v) => set("paused", v)} data-testid="switch-paused" /></label>
              </div>
              <div className="mt-5 space-y-5">
                <Field label="Topics you are happy to help with"><TagInput value={list("helpTopics")} onChange={(v) => set("helpTopics", v)} testId="help-topics" placeholder="PM interviews, switching majors..." /></Field>
                <Field label="Weekly availability" hint="Add a single time or repeat it weekly for eight weeks. Students choose from your saved slots.">
                  <TagInput value={list("availability")} onChange={(v) => set("availability", v)} testId="availability" placeholder="Add with the picker below" />
                  <AvailabilityPicker onAdd={(slots) => set("availability", Array.from(new Set([...list("availability"), ...slots])))} />
                </Field>
                <Field label={`Max chats per month: ${form.maxChats ?? 0}`}><input type="range" min={0} max={30} value={form.maxChats ?? 0} onChange={(e) => set("maxChats", Number(e.target.value))} className="w-full accent-[#990000]" data-testid="input-max-chats" /></Field>
              </div>
            </Card>
          ) : (
            <Card eyebrow="The big question" title="Do you know what career you want?" className="border-cardinal/30">
              <div className="grid gap-3 sm:grid-cols-2">
                {([["yes", "Yes, I have a target"], ["no", "Not sure yet"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setKnows(v)} className={cn("rounded-2xl border-2 p-5 text-left font-display text-xl transition-all active:scale-[.98]", knows === v ? "border-cardinal bg-cardinal text-white" : "bg-paper hover:border-cardinal/40")} data-testid={`button-knows-${v}`}>{l}</button>
                ))}
              </div>
              {knows === "yes" && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Dream role"><Input value={form.dreamRole ?? ""} onChange={(e) => set("dreamRole", e.target.value)} placeholder="Product Manager" className="h-11 rounded-xl" data-testid="input-dream-role" /></Field>
                  <Field label="Dream company (optional)"><Input value={form.dreamCompany ?? ""} onChange={(e) => set("dreamCompany", e.target.value)} placeholder="Google" className="h-11 rounded-xl" data-testid="input-dream-company" /></Field>
                </div>
              )}
            </Card>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.75rem] border bg-card p-6">
            <button onClick={() => submit()} disabled={save.isPending || (welcome && !draftReady)} className="h-12 w-full rounded-full bg-cardinal font-semibold text-white transition-transform active:scale-[.98] disabled:opacity-60" data-testid="button-save-profile">{save.isPending ? "Saving..." : welcome ? "Save and continue" : "Save profile"}</button>
            {welcome && !draftReady && <p className="mt-3 text-xs leading-relaxed text-muted-foreground" data-testid="text-profile-required">To continue, add your USC school, major{alum ? ", and current role." : ", level, and year or graduation year."}</p>}
            {!welcome && !alum && knows === "yes" && (
              <button onClick={() => submit(`/path-finder?role=${encodeURIComponent(form.dreamRole ?? "")}&company=${encodeURIComponent(form.dreamCompany ?? "")}`)} disabled={save.isPending || !form.dreamRole?.trim()} className="mt-2 h-12 w-full rounded-full bg-gold font-semibold text-ink disabled:opacity-50" data-testid="button-save-path">Save and map my path</button>
            )}
            {!welcome && !alum && knows === "no" && (
              <button onClick={() => submit("/explore")} disabled={save.isPending} className="mt-2 h-12 w-full rounded-full bg-gold font-semibold text-ink disabled:opacity-50" data-testid="button-save-explore">Save and explore careers</button>
            )}
          </div>
          {(tips.isPending || tips.data || tips.isError) && (
            <div className="rise rounded-[1.75rem] bg-gold-soft p-6">
              <p className="flex items-center gap-2 font-display text-xl text-ink"><Sparkles className="h-5 w-5 text-cardinal" />Make it stronger</p>
              {tips.isPending ? <AiThinking label="Reading your profile like an alum would..." className="mt-3 bg-card" /> : tips.isError ? <p className="mt-2 text-sm">{errMsg(tips.error)}</p> : (
                <ul className="mt-3 space-y-2.5 text-sm text-ink" data-testid="list-profile-tips">
                  {(tips.data?.suggestions.length ? tips.data.suggestions : [tips.data?.text ?? ""]).slice(0, 3).map((t, i) => <li key={i} className="flex gap-2"><span className="font-display text-cardinal">{i + 1}</span>{t}</li>)}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </Page>
  );
}

function AvailabilityPicker({ onAdd }: { onAdd: (slots: string[]) => void }) {
  const [v, setV] = useState("");
  const [weekly, setWeekly] = useState(true);
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        <Input type="datetime-local" value={v} onChange={(e) => setV(e.target.value)} className="h-10 rounded-xl" data-testid="input-availability-time" />
        <button type="button" disabled={!v || !Number.isFinite(Date.parse(v)) || new Date(v).getTime() <= Date.now()} onClick={() => {
          const slots = Array.from({ length: weekly ? 8 : 1 }, (_, i) => {
            const date = new Date(v);
            date.setDate(date.getDate() + i * 7);
            return date.toISOString();
          });
          onAdd(slots); setV("");
        }} className="rounded-xl border px-4 text-sm font-medium disabled:opacity-40" data-testid="button-add-availability">Add</button>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={weekly} onChange={e => setWeekly(e.target.checked)} className="accent-[#990000]" />Repeat weekly for eight weeks</label>
    </div>
  );
}
