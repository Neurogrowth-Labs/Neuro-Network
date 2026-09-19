import React from "react";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  color?: string;
}

export default function UsageBar({
  label,
  used,
  limit,
  color = "bg-cyan-500",
}: UsageBarProps) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = pct >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-1">
        {/* Label Name - Black in Light Mode, Slate in Dark Mode */}
        <span className="text-slate-900 dark:text-slate-300">{label}</span>
        
        {/* Counter Fraction */}
        <span className={isNearLimit ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-900 dark:text-slate-400"}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>

      {/* Progress Track & Fill */}
      {!isUnlimited && (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? "bg-red-500" : color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      
      {/* Unlimited State Track */}
      {isUnlimited && (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
