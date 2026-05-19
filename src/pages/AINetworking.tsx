import React, { useState } from "react";
import { Sparkles, Loader2, MessageSquare, Briefcase, Zap, Check, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useUser } from "../lib/UserContext";

type AssistantMode = "icebreaker" | "pitch" | "followup";

export default function AINetworking() {
  const { profile } = useUser();
  const [mode, setMode] = useState<AssistantMode>("icebreaker");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!context) {
      toast.error("Please provide some context first");
      return;
    }
    setLoading(true);
    setResponse("");
    try {
      let prompt = "";
      if (mode === "icebreaker") {
        prompt = `Generate 3 engaging, non-awkward icebreaker questions for networking at an event.
User profile: ${profile.job_title} at ${profile.company} in ${profile.industry}.
Event/Context: ${context}
Output strictly as a bulleted list.`;
      } else if (mode === "pitch") {
        prompt = `Write a persuasive 30-second elevator pitch (1 paragraph) for the user.
User profile: ${profile.job_title} at ${profile.company} in ${profile.industry}.
Target audience/Context: ${context}
Keep it conversational, confident, and professional.`;
      } else if (mode === "followup") {
        prompt = `Write an optimized follow-up strategy and email template for a new contact.
User profile: ${profile.job_title} at ${profile.company} in ${profile.industry}.
Meeting context/Notes about the person: ${context}
Include subject line and 1-2 tips for the strategy.`;
      }

      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setResponse(res);
    } catch {
      toast.error("Failed to generate AI response");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          AI Assistant
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">
          Supercharge your networking
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("icebreaker")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === "icebreaker" ? "bg-cyan-500 text-[#0a0a0c]" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Icebreakers
        </button>
        <button
          onClick={() => setMode("pitch")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === "pitch" ? "bg-cyan-500 text-[#0a0a0c]" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <Zap className="w-3.5 h-3.5" /> Pitch
        </button>
        <button
          onClick={() => setMode("followup")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === "followup" ? "bg-cyan-500 text-[#0a0a0c]" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Follow-up
        </button>
      </div>

      <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
        <label className="text-xs font-bold text-white uppercase tracking-widest opacity-80 block">
          {mode === "icebreaker" && "Event Context"}
          {mode === "pitch" && "Target Audience / Goal"}
          {mode === "followup" && "Meeting Notes / Context"}
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={
            mode === "icebreaker"
              ? "e.g. AI founders meetup in SF..."
              : mode === "pitch"
              ? "e.g. Pitching to series A investors..."
              : "e.g. Met Sarah at the afterparty, talked about scaling..."
          }
          className="w-full h-24 bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none transition-colors placeholder:text-white/20"
        />

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#0a0a0c] font-black uppercase tracking-widest text-xs rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Generating..." : "Generate with AI"}
        </button>
      </div>

      {response && (
        <div className="relative bg-white/[0.04] border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Response</span>
            <button
              onClick={copy}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              {copied ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed space-y-2">
            {response.split("\\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* spacer to make it scroll nicely over bottom nav */}
      <div className="h-10"></div>
    </div>
  );
}
