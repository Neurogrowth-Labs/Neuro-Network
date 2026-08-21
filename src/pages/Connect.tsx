import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Fingerprint,
  Link as LinkIcon,
  LockKeyhole,
  MessageSquare,
  QrCode,
  Radar,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

type InputMode = "name" | "url" | "neuroId";

type ProfileCandidate = {
  name: string;
  title: string;
  company: string;
  location: string;
  matchSignals: string[];
  confidence: number;
};

const profileCandidates: ProfileCandidate[] = [
  {
    name: "Alex Mwansa",
    title: "CEO · Technology Entrepreneur",
    company: "ABC Technologies",
    location: "Lusaka / Johannesburg",
    confidence: 94,
    matchSignals: ["Name + company alignment", "Public profile URL", "Recent company announcement"],
  },
  {
    name: "Alex M.",
    title: "Product Strategy Lead",
    company: "Africa Cloud Lab",
    location: "Remote",
    confidence: 71,
    matchSignals: ["Similar name", "Adjacent AI infrastructure role"],
  },
];

const updates = [
  {
    date: "May 2026",
    text: "Appointed to lead ABC Technologies' enterprise AI infrastructure programme.",
    source: "ABC Technologies newsroom",
    published: "May 14, 2026",
    type: "Verified fact",
  },
  {
    date: "July 2026",
    text: "Spoke on practical AI adoption for African businesses at a technology conference.",
    source: "Conference agenda",
    published: "July 9, 2026",
    type: "Verified fact",
  },
  {
    date: "August 2026",
    text: "Published commentary about African AI infrastructure opportunities.",
    source: "Public professional article",
    published: "August 12, 2026",
    type: "Verified fact",
  },
];

const sources = [
  "ABC Technologies newsroom · published May 14, 2026",
  "Conference agenda · published July 9, 2026",
  "Public professional article · published August 12, 2026",
];

export default function Connect() {
  const [inputMode, setInputMode] = useState<InputMode>("name");
  const [query, setQuery] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const selectedProfile = profileCandidates[0];
  const canReview = query.trim().length > 1;

  const placeholder = useMemo(() => {
    if (inputMode === "url") return "Paste a LinkedIn or public professional profile URL";
    if (inputMode === "neuroId") return "Scan or enter a consent-based Neuro NetWorks ID";
    return "Search by name, company, or role";
  }, [inputMode]);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
          <Radar className="h-3.5 w-3.5" /> Scan / Connect
        </div>
        <h1 className="text-4xl font-light tracking-tighter text-white">Connect</h1>
        <p className="text-sm leading-relaxed text-white/55">
          Confirm a professional through consent or supplied identifiers, then generate source-backed relationship intelligence for better conversations.
        </p>
      </div>

      <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Who are you meeting?</p>
          <h2 className="mt-1 text-lg font-bold text-white">Start a profile search</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "name" as const, label: "Name", icon: Users },
            { id: "url" as const, label: "URL", icon: LinkIcon },
            { id: "neuroId" as const, label: "QR/NFC", icon: QrCode },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setInputMode(mode.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === mode.id ? "border-cyan-400/50 bg-cyan-400 text-black" : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"}`}
            >
              <mode.icon className="h-4 w-4" />
              {mode.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setConfirmed(false);
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0c] p-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-cyan-500/60"
          />
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/40">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
            No face-to-identity matching. Connect only combines profiles after strong public, professional, or consent-based matching signals.
          </p>
        </div>
      </section>

      {canReview && (
        <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Identity confirmation</p>
              <h2 className="mt-1 text-lg font-bold text-white">Is this the person you're looking for?</h2>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-300">
              {selectedProfile.confidence}% match
            </span>
          </div>

          {profileCandidates.map((candidate, index) => (
            <button
              key={`${candidate.name}-${candidate.company}`}
              onClick={() => setConfirmed(index === 0)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${confirmed && index === 0 ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">{candidate.name}</h3>
                  <p className="text-sm text-white/60">{candidate.title}</p>
                  <p className="text-xs text-cyan-300">{candidate.company} · {candidate.location}</p>
                </div>
                {confirmed && index === 0 ? <CheckCircle2 className="h-5 w-5 text-cyan-300" /> : <ExternalLink className="h-4 w-4 text-white/30" />}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {candidate.matchSignals.map((signal) => (
                  <span key={signal} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/45">{signal}</span>
                ))}
              </div>
            </button>
          ))}
        </section>
      )}

      {confirmed && (
        <>
          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Professional Snapshot</p>
            <div>
              <h2 className="text-2xl font-light tracking-tight text-white">Alex Mwansa</h2>
              <p className="text-sm font-semibold text-white/75">CEO · Technology Entrepreneur</p>
              <p className="text-sm text-cyan-300">ABC Technologies</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["AI infrastructure", "Enterprise technology", "African markets", "Public speaking"].map((skill) => (
                <div key={skill} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">{skill}</div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">What's new</h2>
            </div>
            {updates.map((update) => (
              <div key={update.date} className="border-l border-cyan-400/30 pl-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{update.date} · {update.type}</p>
                <p className="mt-1 text-sm text-white/75">{update.text}</p>
                <p className="mt-1 text-[11px] text-white/35">Source: {update.source} · Published {update.published}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">AI Engagement Coach</h2>
            </div>
            <div className="space-y-3 text-sm text-white/70">
              <p><span className="font-bold text-white">Best opening:</span> Ask about the company's recent AI infrastructure initiative.</p>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-300"><MessageSquare className="h-3.5 w-3.5" /> Potential conversation</p>
                <p>“I saw that your team has been working on AI infrastructure. What opportunities do you see emerging for African businesses?”</p>
              </div>
              <p><span className="font-bold text-white">Potential collaboration:</span> Your interests appear complementary in AI, enterprise technology, and African markets.</p>
              <p><span className="font-bold text-white">Follow-up:</span> Share one concrete implementation idea and reference the public article after confirming their current priorities.</p>
              <p className="flex items-start gap-2 text-amber-300/80"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Avoid personal, private, or sensitive topics unless the person raises them directly.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Privacy controls</h2>
            </div>
            <div className="grid gap-2 text-xs text-white/55">
              {[
                [Fingerprint, "Claim, correct, remove, or opt out of professional profiles."],
                [LockKeyhole, "Encrypt profile data and maintain an audit trail of searches."],
                [UserCheck, "Distinguish verified facts from AI inference before recommending outreach."],
                [Briefcase, "Rate-limit bulk lookups to prevent mass surveillance."],
              ].map(([Icon, text]) => {
                const PrivacyIcon = Icon as typeof Fingerprint;
                return (
                  <div key={text as string} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <PrivacyIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{text as string}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Sources</h2>
            </div>
            {sources.map((source) => (
              <p key={source} className="text-xs text-white/50">{source}</p>
            ))}
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">3 verified public sources · Last updated: Aug 20, 2026</p>
          </section>
        </>
      )}

      <div className="h-10" />
    </div>
  );
}
