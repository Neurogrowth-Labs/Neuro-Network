import React from "react";
import { Brain } from "lucide-react";

const ROLE_COLORS: any = {
  executive: "text-cyan-400 bg-cyan-500/10",
  manager: "text-blue-400 bg-blue-500/10",
  individual: "text-white/40 bg-white/5",
  other: "text-white/30 bg-white/5",
};

const OPP_COLORS: any = {
  client: "text-white bg-white/10",
  partner: "text-cyan-400 bg-cyan-500/10",
  investor: "text-cyan-400 bg-cyan-500/10",
  supplier: "text-blue-400 bg-blue-500/10",
  media: "text-pink-400 bg-pink-500/10",
  friend: "text-white/50 bg-white/5",
  other: "text-white/30 bg-white/5",
};

function ScoreRing({ score }: any) {
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 50
        ? "#f59e0b"
        : score >= 30
          ? "#3b82f6"
          : "#6b7280";
  return (
    <div
      className="flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0"
      style={{ borderColor: color }}
    >
      <span className="text-[10px] font-bold" style={{ color }}>
        {score || "?"}
      </span>
    </div>
  );
}

export default function AIEnrichBadge({ contact, compact = false }: any) {
  const hasAI = contact.industry || contact.role_level || contact.contact_score;
  if (!hasAI) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        {contact.contact_score > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium flex items-center gap-1">
            <Brain className="w-2.5 h-2.5" />
            {contact.contact_score}
          </span>
        )}
        {contact.role_level && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[contact.role_level]}`}
          >
            {contact.role_level}
          </span>
        )}
        {contact.opportunity_type && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${OPP_COLORS[contact.opportunity_type]}`}
          >
            {contact.opportunity_type}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Brain className="w-3 h-3 text-cyan-400" /> Neuro AI Intelligence
        </p>
        {contact.contact_score > 0 && (
          <ScoreRing score={contact.contact_score} />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {contact.industry && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
            {contact.industry}
          </span>
        )}
        {contact.role_level && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[contact.role_level]}`}
          >
            {contact.role_level}
          </span>
        )}
        {contact.opportunity_type && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize ${OPP_COLORS[contact.opportunity_type]}`}
          >
            {contact.opportunity_type}
          </span>
        )}
        {contact.ai_tags &&
          contact.ai_tags
            .split(",")
            .slice(0, 4)
            .map((t: string, i: number) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30"
              >
                {t.trim()}
              </span>
            ))}
      </div>
      {contact.ai_summary && (
        <p className="text-xs text-white/40 leading-relaxed italic">
          {contact.ai_summary}
        </p>
      )}
    </div>
  );
}
