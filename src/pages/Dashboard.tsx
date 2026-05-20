import React, { useState } from "react";
import CardPreview from "../components/CardPreview";
import CardPDFDownload from "../components/CardPDFDownload";
import UsageBar from "../components/UsageBar";
import PlanBadge from "../components/PlanBadge";
import ProximityWidget from "../components/ProximityWidget";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import { useNavigate } from "react-router-dom";
import { QrCode, Share2, ScanLine, ArrowUpRight, Copy, X, Mail, MessageCircle, MessageSquare } from "lucide-react";
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const navigate = useNavigate();
  
  const cardUrl = `${window.location.origin}/card-view`;

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    toast.success("Profile link copied!");
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=Check out my digital business card: ${cardUrl}`, '_blank');
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=My Digital Business Card&body=Here is my digital business card: ${cardUrl}`;
  };

  const shareViaSMS = () => {
    window.location.href = `sms:?&body=Check out my digital business card: ${cardUrl}`;
  };

  return (
    <div className="p-6 space-y-8 relative">
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
        <button 
          onClick={() => setShowQRModal(true)}
          className="group flex flex-col items-center justify-center py-6 bg-white/[0.02] border border-white/5 hover:bg-cyan-500/5 hover:border-cyan-500/30 rounded-xl transition-all"
        >
          <QrCode className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
            Show QR
          </span>
        </button>
        <button 
          onClick={() => setShowShareModal(true)}
          className="group flex flex-col items-center justify-center py-6 bg-white/[0.02] border border-white/5 hover:bg-cyan-500/5 hover:border-cyan-500/30 rounded-xl transition-all"
        >
          <Share2 className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
            Share App
          </span>
        </button>
        <button 
          onClick={() => navigate("/alerts")}
          className="group flex flex-col items-center justify-center py-6 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400/50 rounded-xl transition-all">
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

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] p-6 rounded-2xl w-full max-w-sm border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium tracking-tight text-white">
                Share via QR Code
              </h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center p-4">
              <QRCodeDisplay value={cardUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] p-6 rounded-2xl w-full max-w-sm border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium tracking-tight text-white">
                Share App
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={shareViaWhatsApp}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">WhatsApp</div>
                  <div className="text-xs text-white/40">Send to a contact directly</div>
                </div>
              </button>
              
              <button 
                onClick={shareViaEmail}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Email</div>
                  <div className="text-xs text-white/40">Share via email client</div>
                </div>
              </button>

              <button 
                onClick={shareViaSMS}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">SMS</div>
                  <div className="text-xs text-white/40">Send a text message</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
