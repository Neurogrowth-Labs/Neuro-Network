import React from "react";

export default function UsageBar({
  label,
  used,
  limit,
  color = "bg-cyan-500",
}: any) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = pct >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-1">
        <span className="text-white/40">{label}</span>
        <span className={isNearLimit ? "text-cyan-400" : "text-white/30"}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? "bg-red-400" : color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-cyan-500/30 to-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
