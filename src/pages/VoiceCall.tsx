import React, { useState, useEffect } from "react";
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
  FileText,
  X,
  Send,
  Signal,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function VoiceCall() {
  const navigate = useNavigate();
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuteOn, setIsMuteOn] = useState(false);
  const [callStatus, setCallStatus] = useState("Calling…");
  const [duration, setDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus("Connected");
      setIsConnected(true);
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isConnected) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Network quality simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.85) setNetworkQuality('poor');
      else if (rand > 0.6) setNetworkQuality('fair');
      else setNetworkQuality('good');
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Transcription
  useEffect(() => {
    if (!isConnected || isMuteOn) return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscriptChunk = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscriptChunk) {
        setNotesText((prev) => prev + (prev ? " " : "") + finalTranscriptChunk);
      }
    };

    try {
      recognition.start();
      setIsTranscribing(true);
    } catch (e) {
      console.error("Speech recognition error:", e);
    }

    // Restart logic to keep it running
    recognition.onend = () => {
      if (isConnected && !isMuteOn) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    return () => {
      recognition.onend = null; // Prevent restart loop on unmount/dep change
      recognition.stop();
      setIsTranscribing(false);
    };
  }, [isConnected, isMuteOn]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSpeakerToggle = async () => {
    try {
      if (!isSpeakerOn) {
        if (navigator.mediaDevices && 'selectAudioOutput' in (navigator.mediaDevices as any)) {
          // @ts-ignore
          const device = await (navigator.mediaDevices as any).selectAudioOutput();
          toast.success(`Audio routed to ${device.label || 'Speaker'}`);
          setIsSpeakerOn(true);
        } else {
          toast.info("Audio routed to Speaker");
          setIsSpeakerOn(true);
        }
      } else {
        toast.info("Audio routed to Earpiece");
        setIsSpeakerOn(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to switch audio output. Continuing with default.");
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-cyan-500/30">
      
      {/* Network Quality Indicator */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 opacity-90 transition-all duration-300">
         <Signal className={`w-5 h-5 ${
            networkQuality === 'good' ? 'text-green-400' :
            networkQuality === 'fair' ? 'text-yellow-400' :
            'text-red-500 animate-pulse'
         }`} />
      </div>

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
        
        {/* Floating Notes Canvas */}
        {showNotes && (
          <div className="absolute inset-x-4 top-24 bottom-32 z-50 bg-[#12121A]/90 backdrop-blur-3xl rounded-3xl border border-white/10 p-5 shadow-2xl flex flex-col transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Meeting Notes
                {isTranscribing && (
                  <span className="flex items-center gap-1.5 ml-2 text-xs font-normal text-cyan-400/80 bg-cyan-400/10 px-2 py-0.5 rounded-full animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Transcribing...
                  </span>
                )}
              </h3>
              <button 
                onClick={() => setShowNotes(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea 
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Type your notes here..."
              className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
            />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  toast.success("Notes saved to Vault");
                  setShowNotes(false);
                }}
                className="flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors"
              >
                <Send className="w-4 h-4" />
                Save to Vault
              </button>
            </div>
          </div>
        )}

        {/* Caller Info */}
        <div className={`flex flex-col items-center space-y-4 transition-all duration-300 ${showNotes ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
            <p className={`text-sm font-medium tracking-wide ${isConnected ? 'text-green-400' : 'text-cyan-400 opacity-80 animate-pulse'}`}>
              {isConnected ? formatDuration(duration) : callStatus}
            </p>
          </div>
        </div>

        {/* Glassmorphism Control Panel */}
        <div className="w-full px-6 max-w-sm">
        <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-3 gap-y-6 gap-x-4 place-items-center mb-6">
            
            <button 
              onClick={handleSpeakerToggle}
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
              onClick={() => setShowNotes(!showNotes)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${showNotes ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">Notes</span>
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

          </div>
          
          <div className="flex justify-center border-t border-white/5 pt-6">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-3 w-full transform active:scale-95 transition-transform bg-[#EF4444] shadow-[0_8px_20px_rgba(239,68,68,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] text-white hover:bg-[#DC2626] rounded-full py-4 border border-[#F87171]/50"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
              <span className="font-semibold tracking-wide">End Call</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
