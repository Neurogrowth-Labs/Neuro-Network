import React from "react";
import CardPreview from "../components/CardPreview";
import CardPDFDownload from "../components/CardPDFDownload";
import UsageBar from "../components/UsageBar";
import PlanBadge from "../components/PlanBadge";
import ProximityWidget from "../components/ProximityWidget";
import { QrCode, Share2, ScanLine, ArrowUpRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "../lib/UserContext";

export const MY_CARD = {
  full_name: "Alexander Vance",
  job_title: "CEO & Founder",
  company: "Neuro NetWorks",
  email: "alex@neuronets.work",
  phone: "+1 (555) 019-2831",
  website: "neuronets.work",
  bio: "Connecting AI and human networks on a global scale.",
  template: "executive",
  theme_color: "#06b6d4",
  linkedin: "https://linkedin.com",
  twitter: "https://twitter.com",
};

export default function Dashboard() {
  const { profile } = useUser();
  const cardData = profile || MY_CARD;

  const copyLink = () => {
    toast.success("Profile link copied!");
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
            My Profile
          </h1>
          <div className="flex items-center gap-2">
            <PlanBadge plan="pro" />
            <span className="text-[10px] font-black tracking-widest uppercase text-white/40">
              Active Card
            </span>
          </div>
        </div>
        <CardPDFDownload card={cardData} />
      </div>

      <div className="relative">
        <CardPreview card={cardData} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={copyLink}
          className="group flex flex-col items-center justify-center py-6 bg-white/[0.02] border border-white/5 hover:bg-cyan-500/5 hover:border-cyan-500/30 rounded-xl transition-all"
        >
          <Copy className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
            Copy Link
          </span>
        </button>
        <button className="group flex flex-col items-center justify-center py-6 bg-white/[0.02] border border-white/5 hover:bg-cyan-500/5 hover:border-cyan-500/30 rounded-xl transition-all">
          <QrCode className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
            Show QR
          </span>
        </button>
        <button className="group flex flex-col items-center justify-center py-6 bg-white/[0.02] border border-white/5 hover:bg-cyan-500/5 hover:border-cyan-500/30 rounded-xl transition-all">
          <Share2 className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
            Share App
          </span>
        </button>
        <button className="group flex flex-col items-center justify-center py-6 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400/50 rounded-xl transition-all">
          <ScanLine className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 group-hover:text-cyan-300 transition-colors">
            Proximity Share
          </span>
        </button>
      </div>

      <ProximityWidget />

      {/* Stats */}
      <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5 space-y-6">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex justify-between">
          30 Day Performance
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <div className="border-r border-white/5 pr-2">
            <p className="text-3xl font-light tracking-tighter text-cyan-400">
              1,204
            </p>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">
              Profile Views
            </p>
          </div>
          <div className="border-r border-white/5 px-2">
            <p className="text-3xl font-light tracking-tighter text-white">
              431
            </p>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">
              Saves
            </p>
          </div>
          <div className="pl-2">
            <p className="text-3xl font-light tracking-tighter text-cyan-400">
              +12%
            </p>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">
              Conversion
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <UsageBar
            label="Business Cards Limit"
            used={1}
            limit={3}
            color="bg-cyan-400"
          />
          <UsageBar
            label="Contact AI Credits"
            used={85}
            limit={200}
            color="bg-white/40"
          />
        </div>
      </div>
    </div>
  );
}
