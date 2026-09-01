import React, { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Check, ChevronDown, ExternalLink, Loader2, Radar, Search, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";

type Profile = { id: string; full_name: string; job_title: string; company: string; avatar_url: string };
type Connection = { id: string; requester_id: string; recipient_id: string; status: "pending" | "accepted" | "rejected" | "cancelled" };
type ProspectForm = {
  prospectName: string; company: string; jobTitle: string; industry: string; location: string; website: string;
  userContext: string; goal: string; knownInformation: string; channel: string; additionalContext: string;
};
type ResearchResult = { report: string; sources: Array<{ title: string; uri: string }> };

const initialProspectForm: ProspectForm = {
  prospectName: "", company: "", jobTitle: "", industry: "", location: "", website: "", userContext: "", goal: "Build a professional relationship", knownInformation: "", channel: "LinkedIn", additionalContext: "",
};

export default function Connect() {
  const { user, profile } = useUser();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [prospectForm, setProspectForm] = useState<ProspectForm>(initialProspectForm);
  const [researching, setResearching] = useState(false);
  const [research, setResearch] = useState<ResearchResult | null>(null);

  useEffect(() => {
    if (!prospectForm.userContext && (profile.job_title || profile.company || profile.industry || profile.bio)) {
      setProspectForm(form => ({ ...form, userContext: [
        profile.job_title && `Role: ${profile.job_title}`,
        profile.company && `Company: ${profile.company}`,
        profile.industry && `Industry: ${profile.industry}`,
        profile.bio && `Background: ${profile.bio}`,
      ].filter(Boolean).join("\n") }));
    }
  }, [profile.job_title, profile.company, profile.industry, profile.bio]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const term = query.trim().replace(/[%,()]/g, "");
    const { data: profiles, error } = await supabase.rpc("discover_profiles", { p_query: term, p_limit: 30 });
    const { data: relationships } = await supabase.from("connections").select("id,requester_id,recipient_id,status").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    if (error) toast.error("Unable to load people. Please try again.");
    // The database RPC excludes the authenticated profile, but retain this client-side
    // guard for installations that have not yet applied the Connect migrations.
    setPeople(((profiles || []) as Profile[]).filter(profile => profile.id !== user.id));
    setConnections((relationships || []) as Connection[]);
    setLoading(false);
  };

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [user?.id, query]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`connections:${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `requester_id=eq.${user.id}` }, load).on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `recipient_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const relationship = (id: string) => connections.find(c => c.requester_id === id || c.recipient_id === id);
  const request = async (recipientId: string) => {
    setSubmitting(recipientId);
    const { error } = await supabase.rpc("request_connection", { p_recipient_id: recipientId });
    if (error) toast.error(error.message.includes("duplicate") ? "A connection request already exists." : "Could not send request.");
    else { toast.success("Connection request sent."); await load(); }
    setSubmitting(null);
  };
  const accept = async (id: string) => {
    setSubmitting(id);
    const { error } = await supabase.rpc("respond_to_connection", { p_connection_id: id, p_accept: true });
    error ? toast.error("Could not accept request.") : toast.success("Connection accepted and added to your Vault.");
    await load(); setSubmitting(null);
  };
  const updateProspect = (key: keyof ProspectForm, value: string) => setProspectForm(form => ({ ...form, [key]: value }));
  const generateBrief = async () => {
    if (!prospectForm.prospectName.trim()) return toast.error("Enter the prospect's full name first.");
    if (!prospectForm.userContext.trim()) return toast.error("Tell Neuro Network a little about your professional context.");
    setResearching(true);
    setResearch(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/prospect-intelligence", {
        method: "POST",
        headers: { "content-type": "application/json", ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify(prospectForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to generate the prospect brief.");
      setResearch(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate the prospect brief.");
    } finally { setResearching(false); }
  };
  const pendingReceived = useMemo(() => connections.filter(c => c.recipient_id === user?.id && c.status === "pending"), [connections, user?.id]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] p-4 space-y-4">
      <header className="flex items-center gap-3 pb-2">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Radar className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Connect</h1>
          <p className="text-xs text-white/50">Discover and connect with members</p>
        </div>
      </header>

      {pendingReceived.length > 0 && (
        <section className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
          <h2 className="font-bold text-white">Incoming requests</h2>
          {pendingReceived.map(c => (
            <div key={c.id} className="mt-3 flex items-center justify-between">
              <span className="text-sm text-white/70">A member wants to connect.</span>
              <button
                onClick={() => accept(c.id)}
                disabled={submitting === c.id}
                className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
              >
                <Check className="mr-1 inline h-3 w-3" /> Accept
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-blue-300/25 bg-gradient-to-br from-blue-500/[.16] to-sky-200/[.07]">
        <button onClick={() => setShowIntelligence(!showIntelligence)} className="flex w-full items-center gap-3 p-4 text-left">
          <div className="rounded-xl border border-sky-200/30 bg-blue-400/10 p-2"><BrainCircuit className="h-5 w-5 text-sky-100" /></div>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-white">Prospect Intelligence</h2><p className="mt-0.5 text-xs text-white/55">Research public signals and prepare an authentic conversation.</p></div>
          <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${showIntelligence ? "rotate-180" : ""}`} />
        </button>
        {showIntelligence && (
          <div className="space-y-4 border-t border-white/10 p-4">
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-3 text-xs leading-relaxed text-amber-50/75"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-amber-200" /> Uses public, professionally relevant sources only. Verify important details and do not use private or sensitive information.</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Who do you want to connect with? *" value={prospectForm.prospectName} onChange={value => updateProspect("prospectName", value)} placeholder="Full name" />
              <div className="grid grid-cols-2 gap-3"><Field label="Company" value={prospectForm.company} onChange={value => updateProspect("company", value)} placeholder="Optional" /><Field label="Job title" value={prospectForm.jobTitle} onChange={value => updateProspect("jobTitle", value)} placeholder="Optional" /></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Industry" value={prospectForm.industry} onChange={value => updateProspect("industry", value)} placeholder="Optional" /><Field label="City or country" value={prospectForm.location} onChange={value => updateProspect("location", value)} placeholder="Optional" /></div>
              <Field label="Website or profile URL" value={prospectForm.website} onChange={value => updateProspect("website", value)} placeholder="Optional" />
            </div>
            <div className="border-t border-white/10 pt-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-sky-100">Tell Neuro Network about yourself</p>
              <TextField label="Your role, project, background, and expertise *" value={prospectForm.userContext} onChange={value => updateProspect("userContext", value)} placeholder="What do you do, and what experience or skills are relevant?" />
              <div className="mt-3 grid grid-cols-2 gap-3"><SelectField label="Your goal" value={prospectForm.goal} onChange={value => updateProspect("goal", value)} options={["Build a professional relationship", "Sales or business development", "Partnership", "Fundraising", "Investment", "Mentorship", "Recruitment", "Career opportunity", "Media or podcast invitation", "Community building", "General networking", "Other"]} /><SelectField label="Contact channel" value={prospectForm.channel} onChange={value => updateProspect("channel", value)} options={["Email", "LinkedIn", "X", "Networking event", "Conference", "Private meeting", "Other"]} /></div>
              <div className="mt-3"><TextField label="What do you know about the prospect already?" value={prospectForm.knownInformation} onChange={value => updateProspect("knownInformation", value)} placeholder="Optional: known work, articles, shared interests, or prior interaction" /></div>
              <div className="mt-3"><TextField label="Additional context" value={prospectForm.additionalContext} onChange={value => updateProspect("additionalContext", value)} placeholder="Optional: mutual contacts, upcoming event, constraints, or reason for reaching out" /></div>
            </div>
            <button onClick={generateBrief} disabled={researching} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-white disabled:opacity-60">{researching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{researching ? "Researching public sources…" : "Generate connection strategy"}</button>
            {research && <ResearchBrief research={research} />}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
        <Search className="h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name, company, or role"
          className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-white/50">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" /> Loading members…
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-8 text-center text-sm text-white/50">
          No other active members match this search.
        </div>
      ) : (
        <div className="space-y-3">
          {people.map(person => {
            const rel = relationship(person.id);
            const received = rel?.recipient_id === user?.id && rel.status === "pending";
            return (
              <article key={person.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4">
                <img
                  src={person.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(person.full_name)}`}
                  alt=""
                  className="h-11 w-11 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-white">{person.full_name || "Platform member"}</h2>
                  <p className="truncate text-xs text-white/50">
                    {[person.job_title, person.company].filter(Boolean).join(" · ") || "Member"}
                  </p>
                </div>
                {received ? (
                  <button onClick={() => accept(rel!.id)} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-black">
                    Accept
                  </button>
                ) : rel?.status === "accepted" ? (
                  <span className="text-xs font-bold text-emerald-300">
                    <Users className="mr-1 inline h-4 w-4" />Connected
                  </span>
                ) : rel ? (
                  <span className="text-xs text-white/45">Request pending</span>
                ) : (
                  <button
                    onClick={() => request(person.id)}
                    disabled={submitting === person.id}
                    className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-50"
                  >
                    {submitting === person.id ? "Sending…" : <><UserPlus className="mr-1 inline h-4 w-4" />Connect</>}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block text-[11px] font-medium text-white/65">{label}<input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-sky-200/60" /></label>;
}
function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block text-[11px] font-medium text-white/65">{label}<textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-sky-200/60" /></label>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block text-[11px] font-medium text-white/65">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#17151d] px-3 py-2 text-sm text-white outline-none focus:border-sky-200/60">{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}
function ResearchBrief({ research }: { research: ResearchResult }) {
  return <article className="rounded-xl border border-white/10 bg-black/25 p-4"><div className="mb-3 flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-sky-100" /><h3 className="text-xs font-bold uppercase tracking-wider text-sky-100">Connection strategy</h3></div><div className="whitespace-pre-wrap text-sm leading-6 text-white/80">{research.report}</div>{research.sources.length > 0 && <div className="mt-5 border-t border-white/10 pt-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">Search-grounded sources</p><div className="space-y-1.5">{research.sources.map(source => <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-cyan-200 hover:text-cyan-100"><ExternalLink className="h-3 w-3 shrink-0" /><span className="truncate">{source.title}</span></a>)}</div></div>}</article>;
}
