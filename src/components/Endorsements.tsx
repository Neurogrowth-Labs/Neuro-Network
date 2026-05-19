import React from "react";
import { Star, Quote } from "lucide-react";

const ENDORSEMENTS = [
  {
    name: "Sarah Chen",
    role: "VP of Sales, TechVenture",
    avatar: "SC",
    color: "from-cyan-500/20 to-blue-500/20",
    text: "Neuro NetWorks completely transformed how I network at conferences. I can share my card instantly and the AI follow-up reminders are a game changer.",
    rating: 5,
  },
  {
    name: "Marcus Williams",
    role: "Founder, LaunchPad.io",
    avatar: "MW",
    color: "from-violet-500/20 to-purple-500/20",
    text: "I closed 3 deals last quarter thanks to the contact intelligence features. Knowing exactly when and how to re-engage is priceless.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Senior PM, CloudScale",
    avatar: "PS",
    color: "from-cyan-500/20 to-emerald-500/20",
    text: "The QR card scanning alone saves me hours every week. My entire team uses Neuro NetWorks now — it's the professional networking tool we always needed.",
    rating: 5,
  },
];

export default function Endorsements() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-[10px] uppercase tracking-widest text-white/60">
          Success Stories
        </h2>
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
          <span className="text-xs font-bold text-cyan-400">4.9</span>
          <span className="text-xs text-white/20">/ 5.0</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {ENDORSEMENTS.map((e, i) => (
          <div
            key={i}
            className={`rounded-xl p-5 border border-white/5 bg-gradient-to-br ${e.color} relative overflow-hidden`}
          >
            <Quote className="absolute top-3 right-3 w-6 h-6 text-white/5" />
            <div className="flex items-center gap-0.5 mb-3">
              {Array.from({ length: e.rating }).map((_, j) => (
                <Star key={j} className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              ))}
            </div>
            <p className="text-sm text-white/80 leading-relaxed mb-4 italic font-medium">
              "{e.text}"
            </p>
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${e.color} border border-white/10 flex items-center justify-center text-xs font-bold text-white/80`}
              >
                {e.avatar}
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">
                  {e.name}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                  {e.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
