import React, { useState } from "react";
import {
  Phone,
  Video,
  MicOff,
  Mic,
  MoreVertical,
  Share,
  Volume2,
  VolumeX,
  MessageCircle,
  Hash,
  AtSign,
  Mail,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function VoiceCall() {
  const navigate = useNavigate();
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuteOn, setIsMuteOn] = useState(false);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-cyan-500/30">
      
      {/* Background Pattern - subtle dark navy-blue with faded icons */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex flex-wrap gap-12 p-8 overflow-hidden items-center justify-center">
         {/* Repeating icon pattern randomly placed */}
         {[...Array(24)].map((_, i) => {
            const icons = [MessageCircle, Hash, AtSign, Mail, Zap];
            const Icon = icons[i % icons.length];
            return (
              <Icon 
                key={i} 
                className="w-12 h-12 text-[#1E3A8A] opacity-20 transform -rotate-12" 
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              />
            )
         })}
         <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black mix-blend-overlay"></div>
      </div>

      {/* Content Container */}
      <div className="z-10 w-full flex flex-col items-center gap-10">
        {/* Caller Info */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[30px] animate-pulse"></div>
            <img 
              src="https://i.pravatar.cc/150?u=sarah" 
              alt="Sarah Jenkins" 
              className="w-32 h-32 rounded-full border border-white/10 shadow-2xl relative z-10"
            />
          </div>
          <div className="flex flex-col items-center space-y-1">
            <h1 className="text-4xl font-semibold tracking-tight text-white drop-shadow-md">
              Sarah Jenkins
            </h1>
            <p className="text-sm text-cyan-400 font-medium opacity-80 tracking-wide animate-pulse">
              Calling…
            </p>
          </div>
        </div>

        {/* Glassmorphism Control Panel */}
        <div className="w-full px-6 max-w-sm">
        <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-3 gap-y-6 gap-x-4 place-items-center">
            
            <button 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${isSpeakerOn ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'}`}>
                {isSpeakerOn ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">Speaker</span>
            </button>

            <button 
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${isVideoOn ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'}`}>
                <Video className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">Video</span>
            </button>

            <button 
              onClick={() => setIsMuteOn(!isMuteOn)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${isMuteOn ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'}`}>
                {isMuteOn ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">Mute</span>
            </button>

            <button 
              onClick={() => toast.info("More options menu opened")}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/80 group-hover:bg-white/10 group-hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <MoreVertical className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">More</span>
            </button>

            <button 
              onClick={() => toast.success("Shared successfully")}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/80 group-hover:bg-white/10 group-hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <Share className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">Share</span>
            </button>

            <button 
              onClick={() => navigate(-1)}
              className="flex flex-col items-center gap-2 group transform active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-[#EF4444] shadow-[0_8px_20px_rgba(239,68,68,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center text-white hover:bg-[#DC2626] transition-colors border border-[#F87171]/50">
                <Phone className="w-6 h-6 rotate-[135deg]" />
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">End Call</span>
            </button>

          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
