import React from "react";

export function computeRelationshipScore(contact: any) {
  let score = 0;
  if (contact.relationship_score) return contact.relationship_score;

  if (contact.email) score += 10;
  if (contact.phone) score += 10;
  if (contact.company) score += 5;
  if (contact.linkedin) score += 10;

  if (contact.met_at) score += 10;
  if (contact.met_date) {
    const days = (Date.now() - new Date(contact.met_date).getTime()) / 86400000;
    if (days < 30) score += 15;
    else if (days < 90) score += 8;
    else if (days < 365) score += 4;
  }

  if (contact.follow_up_done) score += 15;
  else if (contact.follow_up_date) score += 5;

  if (contact.last_contacted) {
    const days =
      (Date.now() - new Date(contact.last_contacted).getTime()) / 86400000;
    if (days < 14) score += 15;
    else if (days < 60) score += 8;
    else if (days < 180) score += 3;
  }

  if (contact.notes?.length > 50) score += 8;
  if (contact.meeting_notes?.length > 30) score += 7;

  if (contact.ai_summary) score += 5;
  if (contact.is_favorite) score += 5;

  return Math.min(score, 100);
}

const TIERS = [
  { min: 75, label: "Strong", color: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  { min: 45, label: "Active", color: "#818cf8", glow: "rgba(129,140,248,0.4)" },
  { min: 20, label: "Warm", color: "#a78bfa", glow: "rgba(167,139,250,0.4)" },
  { min: 0, label: "Cold", color: "#6b7280", glow: "rgba(107,114,128,0.3)" },
];

function getTier(score: number) {
  return TIERS.find((t) => score >= t.min) || TIERS[TIERS.length - 1];
}

export default function RelationshipScore({ contact, size = "md" }: any) {
  const score = computeRelationshipScore(contact);
  const tier = getTier(score);
  const r = size === "sm" ? 14 : 18;
  const strokeW = size === "sm" ? 3 : 3.5;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const dim = (r + strokeW) * 2;

  if (size === "sm") {
    return (
      <div
        className="flex items-center gap-1.5"
        title={`Relationship: ${tier.label} (${score})`}
      >
        <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={r + strokeW}
            cy={r + strokeW}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeW}
          />
          <circle
            cx={r + strokeW}
            cy={r + strokeW}
            r={r}
            fill="none"
            stroke={tier.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 3px ${tier.glow})`,
              transition: "stroke-dasharray 0.6s ease",
            }}
          />
        </svg>
        <span
          className="text-[10px] font-semibold"
          style={{ color: tier.color }}
        >
          {score}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={r + strokeW}
            cy={r + strokeW}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeW}
          />
          <circle
            cx={r + strokeW}
            cy={r + strokeW}
            r={r}
            fill="none"
            stroke={tier.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 5px ${tier.glow})`,
              transition: "stroke-dasharray 0.8s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black" style={{ color: tier.color }}>
            {score}
          </span>
        </div>
      </div>
      <span
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: tier.color }}
      >
        {tier.label}
      </span>
    </div>
  );
}
