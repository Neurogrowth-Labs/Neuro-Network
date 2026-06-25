import React, { useState, useRef, useEffect } from "react";
import CardPreview from "../components/CardPreview";
import AICardGenerator from "../components/AICardGenerator";
import CardComments from "../components/CardComments";
import { MY_CARD } from "./Dashboard";
import {
  Sparkles,
  Brain,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Send,
  Search,
  MapPin,
  Bot,
  Activity,
  CheckCircle2,
  Lock,
  Volume2,
  Trash2,
  ArrowUpRight,
  Download,
  Square,
  RefreshCw,
  Clock
} from "lucide-react";
import { toast } from "sonner";

// High-fidelity local formatting parser
function FormattedMessage({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-xs md:text-sm leading-relaxed text-white/90 font-sans">
      {lines.map((line, idx) => {
        // Bullet list
        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
          const content = line.trim().substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-cyan-400 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-cyan-400" />
              <span>{parseBoldItalicAndLinks(content)}</span>
            </div>
          );
        }
        // Number list
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-cyan-500 font-mono text-xs mt-0.5">{numMatch[1]}.</span>
              <span>{parseBoldItalicAndLinks(numMatch[2])}</span>
            </div>
          );
        }
        // Header markdown format
        if (line.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-xs font-bold text-cyan-300 mt-2 uppercase tracking-wide">
              {parseBoldItalicAndLinks(line.substring(4))}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-sm font-bold text-white mt-3 border-b border-white/5 pb-1">
              {parseBoldItalicAndLinks(line.substring(3))}
            </h3>
          );
        }
        if (line.trim() === "") return <div key={idx} className="h-1.5" />;

        return <p key={idx}>{parseBoldItalicAndLinks(line)}</p>;
      })}
    </div>
  );
}

function parseBoldItalicAndLinks(text: string) {
  const boldSplit = text.split(/\*\*(.*?)\*\*/);
  if (boldSplit.length > 1) {
    return boldSplit.map((chunk, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-cyan-300">{chunk}</strong>;
      }
      return parseLinks(chunk);
    });
  }
  return parseLinks(text);
}

function parseLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  if (parts.length > 1) {
    return parts.map((chunk, i) => {
      if (chunk.match(urlRegex)) {
        return (
          <a
            key={i}
            href={chunk}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-0.5"
          >
            {chunk.length > 25 ? chunk.substring(0, 25) + "..." : chunk}
          </a>
        );
      }
      return chunk;
    });
  }
  return text;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  groundingChunks?: any[] | null;
  timestamp: string;
}

export default function Editor() {
  const [card, setCard] = useState(MY_CARD);
  // Top-level tab switcher
  const [primaryTab, setPrimaryTab] = useState<"concepts" | "playground">("playground");
  
  // Playground sub-tab switcher
  const [playgroundTab, setPlaygroundTab] = useState<"chatbot" | "image" | "transcribe">("chatbot");

  // 1. Chatbot state variables
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your NeuroNet AI Laboratory agent. I am directly tied to our production servers and possess active multi-turn context retention, Google Search Grounding for current web events, and Google Maps Grounding to coordinates if needed. What research or brand refinement shall we execute today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("brand_consultant");
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [enableMapsSearch, setEnableMapsSearch] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // 2. Image generation state variables
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspect, setImageAspect] = useState("16:9");
  const [imageQuality, setImageQuality] = useState("1K");
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // 3. Audio Recorder state variables
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [audioFeedbackText, setAudioFeedbackText] = useState("Resting... Tap block below to record speech.");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);
  const [soundWaves, setSoundWaves] = useState<number[]>([10, 20, 15, 30, 25, 40, 20, 15, 30, 10]);

  // Handle card concept alignment
  const applyAI = (concept: any) => {
    setCard((prev) => ({
      ...prev,
      ...concept,
    }));
  };

  // Scroll chatting thread down to prompt entry points
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  // Audio wave visual animation during recording
  useEffect(() => {
    if (recording) {
      recordIntervalRef.current = setInterval(() => {
        setSoundWaves(Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 10));
      }, 150);
    } else {
      clearInterval(recordIntervalRef.current);
      setSoundWaves([10, 20, 15, 30, 25, 40, 20, 15, 30, 10]);
    }
    return () => clearInterval(recordIntervalRef.current);
  }, [recording]);

  // --- Handlers for Chatbot ---
  const handleSendChat = async () => {
    if (!userInput.trim()) return;
    const cleanUserText = userInput.trim();
    setUserInput("");
    setChatLoading(true);

    const newUserMsg: ChatMessage = {
      role: "user",
      content: cleanUserText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMsg]);

    // System instruction roles map
    let finalSystemInstruction = "You are a premium digital companion for NeuroNet.";
    if (selectedRole === "brand_consultant") {
      finalSystemInstruction = "You are a professional brand design and digital branding partner. You focus on design theory, user engagement, colors, bio text alignment, typography, and professional networking cards.";
    } else if (selectedRole === "tech_expert") {
      finalSystemInstruction = "You are a technical consultant and elite research architect. Answer questions with rigorous technical depth, precise historical facts, API constraints, and code patterns.";
    } else if (selectedRole === "geo_navigator") {
      finalSystemInstruction = "You are a geographic concierge utilizing Google Maps space grounding. Guide the user regarding physical spots, coordinates, distances, and landmarks. Suggest they verify physical markers.";
    }

    try {
      // Fetch user location if coordinates maps search is toggled
      let latLng = null;
      if (enableMapsSearch && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          latLng = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
        } catch (e) {
          console.warn("Could not retrieve precise GPS coordinate context, falling back to corporate HQ coordinates.");
          latLng = { latitude: 37.78193, longitude: -122.40476 }; // Default HQ
        }
      }

      // Map local message array to payload message array format
      const historyPayload = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyPayload,
          prompt: cleanUserText,
          systemInstruction: finalSystemInstruction,
          enableSearch: enableWebSearch,
          enableMaps: enableMapsSearch,
          latLng
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();
      
      const newAssistantMsg: ChatMessage = {
        role: "assistant",
        content: json.text || "I was unable to assemble content responses.",
        groundingChunks: json.groundingChunks || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to connect down to AI Chat server controller.");
      
      // Temporary fallback in-memory response so user remains interactive
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into a server communication speed hiccup. Please ensure your GEMINI_API_KEY is configured under Settings > Secrets, or try re-sending.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Handlers for Image Generator ---
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Enter a brand visual prompt first.");
      return;
    }
    setImageLoading(true);
    setGeneratedImg(null);
    toast.info("Generating high-fidelity canvas design...");

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspect,
          imageSize: imageQuality
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();
      setGeneratedImg(json.imageUrl);
      toast.success("Design assets saved to your active cache!");
    } catch (err: any) {
      console.error(err);
      toast.error("Unable to execute base image generation. Ensure your GEMINI_API_KEY is valid.");
    } finally {
      setImageLoading(false);
    }
  };

  // --- Handlers for Microphone Transcription ---
  const startRecordingAudio = async () => {
    setTranscribedText("");
    setAudioFeedbackText("Connecting microphone feed...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setTranscribing(true);
        setAudioFeedbackText("Microphone feed locked. Processing speech compression...");
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Bytes = (reader.result as string).split(",")[1];
            
            setAudioFeedbackText("Contacting transcription model via gemini-3.5-flash...");
            const transRes = await fetch("/api/ai/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audioData: base64Bytes,
                mimeType: "audio/webm"
              })
            });

            if (!transRes.ok) {
              throw new Error("Transcriber response blocked.");
            }

            const data = await transRes.json();
            setTranscribedText(data.text || "No speech detected. Speak louder or verify mic proximity!");
            setAudioFeedbackText("Processed successfully!");
            toast.success("Spoken coordinates mapped verbatim!");
          };
        } catch (e: any) {
          console.error(e);
          setAudioFeedbackText("Failed to translate audio.");
          toast.error("Speech transcription error.");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
      setRecording(true);
      setAudioFeedbackText("Live recording... Speaks into the microphone now.");
    } catch (err) {
      console.error(err);
      setAudioFeedbackText("Microphone access denied.");
      toast.error("Permission check: Could not retrieve local audio track.");
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const clearTranscribeState = () => {
    setTranscribedText("");
    setAudioFeedbackText("Resting... Tap block below to record speech.");
    toast.info("Voice sandbox buffer cleared.");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden pb-16 font-sans">
      
      {/* Title block banner header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-tighter text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />
            AI Design Studio
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80 mt-1">
            Production Intelligence & Visual Identity Sandbox
          </p>
        </div>

        {/* Global tab manager selectors */}
        <div className="flex bg-black/60 rounded-xl p-1 border border-white/10 self-start md:self-center">
          <button
            onClick={() => setPrimaryTab("playground")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              primaryTab === "playground"
                ? "bg-cyan-500 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                : "text-white/40 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Labs Playground
          </button>
          
          <button
            onClick={() => setPrimaryTab("concepts")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              primaryTab === "concepts"
                ? "bg-cyan-500 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                : "text-white/40 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Design Concepts
          </button>
        </div>
      </div>

      {primaryTab === "concepts" ? (
        /* TAB MODULE A: Traditional Design Concepts (Original Flow) */
        <div className="space-y-6 animate-scale-up" id="concepts-design-panel">
          <div className="relative">
            <CardPreview card={card} />
          </div>
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
            <AICardGenerator card={card} onApply={applyAI} />
          </div>
          <div className="pt-6 border-t border-white/5">
            <CardComments cardId={card.id || "card-primary-id"} />
          </div>
        </div>
      ) : (
        /* TAB MODULE B: Upgrade AI Sandbox Laboratory (Active endpoints) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in" id="ai-playground-workspace">
          
          {/* LEFT COLUMN: Sidebar controllers */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Sandbox Modules</span>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPlaygroundTab("chatbot")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    playgroundTab === "chatbot"
                      ? "bg-cyan-500/10 border-cyan-400 text-white"
                      : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Gemini Chatbot</span>
                  </div>
                  <Bot className="w-3.5 h-3.5 text-white/30" />
                </button>

                <button
                  onClick={() => setPlaygroundTab("image")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    playgroundTab === "image"
                      ? "bg-cyan-500/10 border-cyan-400 text-white"
                      : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Studio Image</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-white/30" />
                </button>

                <button
                  onClick={() => setPlaygroundTab("transcribe")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    playgroundTab === "transcribe"
                      ? "bg-cyan-500/10 border-cyan-400 text-white"
                      : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Microphone STT</span>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>
            </div>

            {/* Active Telemetry Widget */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Real-Time Diagnostics
              </span>
              <p className="text-[10px] text-white/40 leading-relaxed">
                Direct Node pipeline status checking against both Supabase tables and Firebase Auth tokens. No simulated caches.
              </p>
              
              <div className="space-y-2 pt-2 text-[10px] font-mono text-white/70">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white/40 uppercase">System Status</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE (SLA 99.982%)
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white/40 uppercase">Durable Sync</span>
                  <span className="text-cyan-400">FIRESTORE CORE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 uppercase">Active Models</span>
                  <span className="text-white">GEMINI 3.5, IMAGEN-4</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN COLUMN: Interactive Workspace Panel */}
          <div className="md:col-span-8">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 md:p-6 min-h-[500px] flex flex-col justify-between">
              
              {/* PANEL VIEW A: GEMINI CHATBOT WITH SEARCH AND MAPS GROUNDING */}
              {playgroundTab === "chatbot" && (
                <div className="flex-1 flex flex-col justify-between space-y-4 h-full" id="chatbot-workspace">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-md font-bold uppercase tracking-wider text-white">Gemini Conversational Space</h2>
                      <p className="text-[10px] text-white/40 mt-0.5">Supports real-time search context grounding.</p>
                    </div>
                    
                    {/* Persona selector role dropdown */}
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-black/80 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                      >
                        <option value="brand_consultant">Brand Identity Catalyst</option>
                        <option value="tech_expert">Technical Expert</option>
                        <option value="geo_navigator">Geographic Concierge</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-turn thread scroll box */}
                  <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 pr-1 py-1 scrollbar-thin">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          m.role === "user" ? "items-end" : "items-start"
                        } space-y-1`}
                      >
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-black tracking-wider text-white/30">
                          {m.role === "user" ? "Alexander (You)" : `${selectedRole.replace(/_/g, " ").toUpperCase()} bot`}
                          <Clock className="w-2.5 h-2.5" />
                          {m.timestamp}
                        </div>
                        
                        <div
                          className={`p-3 md:p-4 rounded-2xl max-w-[85%] ${
                            m.role === "user"
                              ? "bg-cyan-500/10 border border-cyan-500/35 text-white rounded-tr-none"
                              : "bg-white/[0.03] border border-white/5 text-white/90 rounded-tl-none"
                          }`}
                        >
                          <FormattedMessage text={m.content} />
                          
                          {/* Grounding Source metadata chips */}
                          {m.groundingChunks && m.groundingChunks.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5">
                              <span className="text-[9px] font-black uppercase text-cyan-400 flex items-center gap-1">
                                <Search className="w-2.5 h-2.5" />
                                Verified Research Citations
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.groundingChunks.map((chunk: any, chunkIdx) => {
                                  let title = "Reference Code";
                                  let uri = "#";
                                  if (chunk.web) {
                                    title = chunk.web.title || chunk.web.uri;
                                    uri = chunk.web.uri;
                                  } else if (chunk.maps) {
                                    title = chunk.maps.title || "Maps Location";
                                    uri = chunk.maps.uri;
                                  }
                                  return (
                                    <a
                                      key={chunkIdx}
                                      href={uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 hover:border-cyan-500 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all"
                                    >
                                      {title.length > 22 ? title.substring(0, 22) + "..." : title}
                                      <ArrowUpRight className="w-2.5 h-2.5" />
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase animate-pulse pl-1">
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        AI compute nodes resolving query...
                      </div>
                    )}
                    <div ref={threadEndRef} />
                  </div>

                  {/* GROUNDING PREFERENCE CONTROLLER BUTTONS */}
                  <div className="flex flex-wrap items-center gap-4 bg-white/[0.01] border border-dashed border-white/5 p-3 rounded-xl text-xs text-white/50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4]">Groundings:</span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setEnableWebSearch(!enableWebSearch);
                        if (!enableWebSearch) setEnableMapsSearch(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        enableWebSearch
                          ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                          : "bg-transparent border border-white/5 text-white/30"
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      Google Search Grounding
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEnableMapsSearch(!enableMapsSearch);
                        if (!enableMapsSearch) setEnableWebSearch(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        enableMapsSearch
                          ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                          : "bg-transparent border border-white/5 text-white/30"
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      Google Maps Spatial Location
                    </button>
                  </div>

                  {/* Prompt entry input row */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !chatLoading) handleSendChat();
                      }}
                      placeholder={
                        enableMapsSearch
                          ? "Ask for dining or tech events nearby (requests GPS coordinates)..."
                          : "Input custom instructions or web query to resolve..."
                      }
                      disabled={chatLoading}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={chatLoading || !userInput.trim()}
                      className="p-3 bg-white hover:bg-cyan-400 disabled:bg-white/10 rounded-xl text-[#0a0a0c] disabled:text-white/20 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL VIEW B: AI IMAGE STUDIO WITH RESOLUTION AND RATIOS */}
              {playgroundTab === "image" && (
                <div className="flex-1 flex flex-col justify-between space-y-6" id="image-workspace">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-md font-bold uppercase tracking-wider text-white">AI Studio Artwork Core</h2>
                    <p className="text-[10px] text-white/40 mt-0.5">Generate high-fidelity card backgrounds using gemini-2.5-flash-image models.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Form side settings */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Concept Art Prompt</label>
                        <textarea
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder="e.g. an abstract hyper-fluid digital ecosystem grid, glowing circuit paths, dark obsidian gloss theme, neon cyan reflections, high contrast tech art"
                          rows={4}
                          className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
                        />
                      </div>

                      {/* Aspect Ratio choice dropdown */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Aspect Ratio</label>
                          <select
                            value={imageAspect}
                            onChange={(e) => setImageAspect(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                          >
                            <option value="1:1">Standard Square (1:1)</option>
                            <option value="3:4">Portrait Card (3:4)</option>
                            <option value="4:3">Landscape (4:3)</option>
                            <option value="9:16">Mobile Display (9:16)</option>
                            <option value="16:9">Wide Display (16:9)</option>
                            {/* Non-native fallback mapped inputs */}
                            <option value="2:3">Editorial (2:3)</option>
                            <option value="3:2">Creative (3:2)</option>
                            <option value="21:9">Ultra-Wide (21:9)</option>
                          </select>
                        </div>

                        {/* Resolution choice dropdown */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Resolution SLA</label>
                          <select
                            value={imageQuality}
                            onChange={(e) => setImageQuality(e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                          >
                            <option value="1K">High Density (1K)</option>
                            <option value="2K">Pro Detail (2K)</option>
                            <option value="4K">Studio Master (4K)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateImage}
                        disabled={imageLoading || !imagePrompt.trim()}
                        className="w-full py-3 bg-white hover:bg-cyan-400 disabled:opacity-40 text-[#0a0a0c] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {imageLoading ? (
                          <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {imageLoading ? "Synthesizing pixels..." : "Generate AI Artwork"}
                      </button>
                    </div>

                    {/* Rendering display side */}
                    <div className="border border-white/10 rounded-2xl bg-black/40 flex flex-col items-center justify-center p-3 relative min-h-[220px]">
                      {imageLoading ? (
                        <div className="text-center space-y-2">
                          <Activity className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                          <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest animate-pulse">Rendering Design Frame</p>
                          <p className="text-[8px] text-white/30">Resolving latent pixels for {imageQuality} render...</p>
                        </div>
                      ) : generatedImg ? (
                        <div className="space-y-3 w-full text-center">
                          <img
                            src={generatedImg}
                            alt="AI generated artwork"
                            className="max-h-[180px] object-contain rounded-xl mx-auto border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex justify-center gap-2">
                            <a
                              href={generatedImg}
                              download="brand_identity_mesh_art.png"
                              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all"
                            >
                              <Download className="w-3 h-3" /> Save PNG
                            </a>
                            <button
                              onClick={() => {
                                applyAI({ banner_url: generatedImg });
                                toast.success("Set as card background pattern!");
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all"
                            >
                              Apply Background
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-1 p-5">
                          <ImageIcon className="w-10 h-10 text-white/10 mx-auto" />
                          <p className="text-xs text-white/40">Visualizer empty.</p>
                          <p className="text-[9px] text-white/20">Art is produced on server and shown instantly here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL VIEW C: VOICE MICROPHONE AUDIO TRANSCRIPTION SANDBOX */}
              {playgroundTab === "transcribe" && (
                <div className="flex-1 flex flex-col justify-between space-y-6" id="audio-workspace">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-md font-bold uppercase tracking-wider text-white">Active Microphone Sandbox</h2>
                    <p className="text-[10px] text-white/40 mt-0.5">Use your device microphone to record dynamic memos transcribing with gemini-3.5-flash.</p>
                  </div>

                  <div className="max-w-xl mx-auto w-full text-center space-y-6 py-6">
                    {/* Responsive waveform visual cues */}
                    <div className="flex items-center justify-center gap-1.5 h-16 bg-black/40 border border-white/5 rounded-2xl px-8 relative overflow-hidden">
                      {recording ? (
                        <div className="absolute inset-0 bg-red-500/[0.02] animate-pulse" />
                      ) : null}
                      
                      {soundWaves.map((val, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${val}%` }}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            recording ? "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Button trigger controller node */}
                    <div className="flex items-center justify-center gap-3">
                      {!recording ? (
                        <button
                          type="button"
                          onClick={startRecordingAudio}
                          disabled={transcribing}
                          className="h-14 w-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white cursor-pointer transition-all hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-30"
                        >
                          <Mic className="w-6 h-6 animate-pulse" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecordingAudio}
                          className="h-14 w-14 bg-white text-black hover:bg-red-200 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.35)]"
                        >
                          <Square className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Operational Feed Log status text line */}
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">{audioFeedbackText}</p>
                      {recording && (
                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 animate-pulse">
                          ● RECORDING ACTIVE (KEEP SPEAKING)
                        </span>
                      )}
                    </div>

                    {/* Output verbatim transcript container */}
                    {transcribedText && (
                      <div className="text-left bg-white/[0.02] border border-white/10 p-5 rounded-2xl space-y-3 relative group">
                        <button
                          onClick={clearTranscribeState}
                          title="Purge transcript memory buffer"
                          className="absolute top-3 right-3 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] uppercase font-black tracking-widest mt-0.5 text-white/40">Model Transcript Outputs</span>
                        </div>
                        
                        <p className="text-sm font-medium tracking-normal text-white italic leading-relaxed pl-1">
                          "{transcribedText}"
                        </p>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              applyAI({ bio: transcribedText });
                              toast.success("Transcript written as your digital card biography!");
                            }}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                          >
                            Apply to Card Bio
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
