import React from "react";
import { Link } from "react-router-dom";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpgradePrompt({
  feature,
  requiredPlan = "pro",
  compact = false,
}: any) {
  const planLabel = requiredPlan === "business" ? "Business" : "Pro";
  const planColor =
    requiredPlan === "business" ? "text-cyan-400" : "text-cyan-400";
  const btnClass =
    requiredPlan === "business"
      ? "bg-white hover:bg-cyan-400 text-black uppercase tracking-widest text-[10px] font-black"
      : "bg-white hover:bg-cyan-400 text-black uppercase tracking-widest text-[10px] font-black";

  if (compact) {
    return (
      <Link to="/pricing">
        <button
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-current/20 transition-all hover:opacity-80 ${planColor}`}
        >
          <Lock className="w-3 h-3" />
          Upgrade to {planLabel}
        </button>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-cyan-400" />
      </div>
      <div>
        <p className="font-semibold">
          {feature} is a {planLabel} feature
        </p>
        <p className="text-sm text-white/30 mt-1">
          Upgrade your plan to unlock this and more.
        </p>
      </div>
      <Link to="/pricing">
        <Button className={`${btnClass} font-semibold`}>
          <Zap className="w-4 h-4 mr-2" /> Upgrade to {planLabel}
        </Button>
      </Link>
    </div>
  );
}
