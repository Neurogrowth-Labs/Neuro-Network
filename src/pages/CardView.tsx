import React, { useState } from "react";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import { Share2, Link as LinkIcon, Mail, X, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function CardView() {
  const [showShareModal, setShowShareModal] = useState(false);
  const cardUrl = "https://cardvault.app/u/jane-doe"; // Example dynamic value

  return (
    <div className="p-6 space-y-8 flex flex-col items-center relative">
      <div className="w-full max-w-lg flex flex-col pt-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-4xl font-light tracking-tighter text-white">
            Card View
          </h1>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold shadow-lg hover:bg-white/90 transition-all"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
        <p className="text-white/60 mb-8">
          Preview of your digital networking card.
        </p>

        <div className="flex justify-center">
          <QRCodeDisplay value={cardUrl} />
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] p-6 rounded-2xl w-full max-w-md border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium tracking-tight text-white">
                Share Card
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
                onClick={() => setShowShareModal(false)}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all text-left">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Show QR Code
                  </div>
                  <div className="text-xs text-white/40">
                    Let someone scan your card
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(cardUrl);
                  toast.success("Link copied!");
                }}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Copy Link</div>
                  <div className="text-xs text-white/40">{cardUrl}</div>
                </div>
              </button>

              <a
                href={`mailto:?subject=My Digital Business Card&body=Here is my digital business card: ${cardUrl}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Send via Email
                  </div>
                  <div className="text-xs text-white/40">
                    Share your link directly via email
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
