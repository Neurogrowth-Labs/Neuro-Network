import React from "react";
import { Sparkles, Zap, Building2 } from "lucide-react";
import { PLANS } from "@/lib/planAccess";

const icons: any = { free: Sparkles, pro: Zap, business: Building2 };

export default function PlanBadge({ plan = "free", size = "sm" }: any) {
  const info = PLANS[plan] || PLANS.free;
  const Icon = icons[plan] || Sparkles;

  if (size === "lg") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/20 ${info.badge}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {info.name}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/20 ${info.badge}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {info.name}
    </span>
  );
}
