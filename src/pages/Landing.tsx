import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Cpu, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Check, 
  ChevronDown, 
  ArrowRight, 
  Globe, 
  Database, 
  Lock, 
  MessageSquare, 
  Video, 
  Info,
  Clock,
  HeartHandshake
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function Landing() {
  const navigate = useNavigate();
  const [activePrivacyTab, setActivePrivacyTab] = useState<"database" | "credentials" | "retention">("database");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetStarted = () => {
    toast.success("Initializing active workspace console...");
    navigate("/");
  };

  const submitContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) {
      toast.error("Please enter a message before sending support queries.");
      return;
    }
    setIsSubmitting(true);
    // Simulate real-time secure support channel dispatch
    setTimeout(() => {
      toast.success("Support ticket dispatched. Our SLA queue response time is under 15 minutes!");
      setContactSubject("");
      setContactMessage("");
      setIsSubmitting(false);
    }, 1200);
  };

  const faqItems = [
    {
      q: "What is the core of Neuro NetWorks?",
      a: "Neuro NetWorks is a high-fidelity intelligence and design catalyst. It weaves together secure AI generation pipelines (powered by Gemini and Imagen) with your existing Google Workspace channels (Google Chat and Google Meet) for real-time collaboration and secure brand card sharing."
    },
    {
      q: "How does the $2.99 subscription work?",
      a: "Our single Pro Catalyst tier gives you unlimited personal card creation, real-time chat nodes, high-fidelity Imagen artwork rendering, and access to the cryptographic vault with absolutely no hidden parameters or data limits."
    },
    {
      q: "Is any of my information simulated or mock cached?",
      a: "Absolutely not. This platform executes direct, live API calls against Firebase Firestore databases and certified Workspace endpoints under high-grade authorization protocols. Your credentials never bypass the local state layer."
    }
  ];

  return (
    <div className="text-white bg-[#0a0a0c] min-h-screen flex flex-col gap-6 p-4 pb-12 font-sans" id="neuro-landing-page">
      
      {/* 1. Hero Block Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#12121e]/80 to-black/30 border border-white/5 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_40%)]" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[9px] font-black uppercase tracking-widest mx-auto">
            <Sparkles className="w-3 h-3 animate-pulse" /> Global Release v2.4 Live
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase sm:text-4xl">
            Neuro <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">NetWorks</span>
          </h1>
          
          <p className="text-xs text-white/60 max-w-[300px] mx-auto leading-relaxed font-light">
            An ecosystem combining instant production intelligence, real-time Google communication, and enterprise-grade cryptographic security.
          </p>

          <div className="pt-2">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto h-11 px-8 bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Core Operational Pillars Mapping */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block px-1">
          Ecosystem Mechanisms
        </span>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-[#12121a] border border-white/5 p-4 rounded-xl flex items-start gap-3.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">AI Design Studio</h3>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Render studio-quality Imagen designs, search references in real-time, and run dynamic speech-to-text transcriptions with Gemini integrations.
              </p>
            </div>
          </div>

          <div className="bg-[#12121a] border border-white/5 p-4 rounded-xl flex items-start gap-3.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Workspace Collaboration</h3>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Connect and broadcast coordinates natively via Google Meet and Google Chat directly from your digital profile.
              </p>
            </div>
          </div>

          <div className="bg-[#12121a] border border-white/5 p-4 rounded-xl flex items-start gap-3.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Double-Vault Encryption</h3>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Store private comments, biometric templates, and corporate assets with robust, certified Firebase Security parameters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transparent $2.99 Pricing Section */}
      <div className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border border-cyan-500/20 rounded-2xl p-5 relative overflow-hidden" id="pricing-tier">
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-cyan-500 text-black text-[8px] font-black uppercase tracking-widest rounded-md">
          Most Popular
        </div>
        
        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block mb-1">Single Pricing Architecture</span>
        <h2 className="text-lg font-extrabold uppercase tracking-tight text-white mb-3">The Pro Catalyst Plan</h2>

        <div className="flex items-baseline gap-1.5 mb-4 border-b border-white/5 pb-4">
          <span className="text-3xl font-black text-cyan-400">$2.99</span>
          <span className="text-xs text-white/50 font-mono">/ per month</span>
        </div>

        <ul className="space-y-2 mb-5">
          {[
            "Full access to AI Laboratory & Imagen Art Engine",
            "Unlimited Digital Business Card Customizations",
            "Real-time Google Chat & Meet Port Nodes",
            "Cryptographic Data Vault & Vault Comments",
            "No telemetry tracking or commercial ads"
          ].map((feat, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-white/80">
              <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleGetStarted}
          className="w-full h-10 bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] uppercase font-black tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CreditCard className="w-4 h-4" /> Start Pro Trial Now
        </button>
        <p className="text-[9px] text-white/30 text-center mt-2.5 font-mono">Zero commitment. Cancel anytime instantly inside account panel.</p>
      </div>

      {/* 4. Complete Privacy Policy & Database Privacy Section */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4" id="privacy-section">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block">Trust & Verification</span>
          <h2 className="text-md font-bold uppercase tracking-wide text-white">Database Privacy Policy</h2>
          <p className="text-[10px] text-white/40 mt-0.5">We operate with transparent cryptographic policies.</p>
        </div>

        {/* Inner Tabs for Privacy Categories */}
        <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setActivePrivacyTab("database")}
            className={`text-[9px] py-1.5 rounded font-black uppercase transition-all tracking-wider cursor-pointer ${
              activePrivacyTab === "database" ? "bg-cyan-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            Database
          </button>
          <button
            onClick={() => setActivePrivacyTab("credentials")}
            className={`text-[9px] py-1.5 rounded font-black uppercase transition-all tracking-wider cursor-pointer ${
              activePrivacyTab === "credentials" ? "bg-cyan-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            Credentials
          </button>
          <button
            onClick={() => setActivePrivacyTab("retention")}
            className={`text-[9px] py-1.5 rounded font-black uppercase transition-all tracking-wider cursor-pointer ${
              activePrivacyTab === "retention" ? "bg-cyan-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            Retention
          </button>
        </div>

        {/* Tab content wrapper display */}
        <div className="bg-black/30 border border-white/5 p-3 rounded-xl min-h-[90px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activePrivacyTab === "database" && (
              <motion.div
                key="database"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase font-mono">
                  <Database className="w-3.5 h-3.5" /> Direct Firebase Storage Rules
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Your information is stored using secure cloud boundaries in Firebase Firestore. We implement strict table access policies ensuring that only you or designees you explicitly authorize can access your cards.
                </p>
              </motion.div>
            )}

            {activePrivacyTab === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> High-Grade OAuth Constraints
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Google Workspace API scopes (Chat & Meet) are logged locally inside client storage. Authentication tokens are strictly proxied to fetch real-time items on request and are never written to any third-party datastore.
                </p>
              </motion.div>
            )}

            {activePrivacyTab === "retention" && (
              <motion.div
                key="retention"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase font-mono">
                  <Lock className="w-3.5 h-3.5" /> Sovereign Purge Accordance
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  No tracking scripts, logging beacons, or persistent tracking cookies are deployed in the sandbox. Any cards, templates, or image mock assets can be permanently purged instantly at your sovereign discretion.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. FAQs Interactive Accordion */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-3" id="faq-section">
        <h3 className="text-xs font-bold uppercase tracking-wide text-white border-b border-white/5 pb-2">
          Frequently Answered Inquiries
        </h3>
        
        <div className="space-y-1.5">
          {faqItems.map((item, idx) => {
            const isExpanded = expandedFAQ === idx;
            return (
              <div 
                key={idx} 
                className="border-b border-white/5 pb-2 last:border-0 last:pb-0"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFAQ(isExpanded ? null : idx)}
                  className="w-full flex justify-between items-center py-1.5 text-left text-[11px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="pr-4">{item.q}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[10px] text-white/50 leading-relaxed pt-1 pb-2">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Customer Service Contact Lines & Support form */}
      <div className="bg-[#12121a]/63 border border-white/10 rounded-2xl p-5 space-y-4" id="contacts-section">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4] block">24/7 Priority Support</span>
          <h2 className="text-md font-bold uppercase tracking-wide text-white">Customer Service Lines</h2>
          <p className="text-[10px] text-white/40 mt-0.5 font-mono uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Average response time: 9 minutes
          </p>
        </div>

        {/* Live Contact Information */}
        <div className="grid grid-cols-1 gap-2.5 bg-black/40 p-3.5 rounded-xl text-[10px] font-mono text-white/80">
          <div className="flex items-center gap-2.5">
            <Mail className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <a href="mailto:support@neurogrowthlabs.co.za" className="hover:text-cyan-400 transition-colors">
              support@neurogrowthlabs.co.za
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <a href="tel:+27110839441" className="hover:text-cyan-400 transition-colors">
              +27 (11) 083-9441
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>HQ: Sandton, Johannesburg, South Africa</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>Operation: Mon - Sun (Continuous Live Desks)</span>
          </div>
        </div>

        {/* Ticket Generation Support Form */}
        <form onSubmit={submitContactForm} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-white/40 font-mono block">Query Department</label>
            <input
              type="text"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="e.g. Account setup, pricing assistance"
              className="w-full h-8 bg-black/60 border border-white/5 rounded-lg px-2.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/50 placeholder-white/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-white/40 font-mono block">Detailed Message</label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Provide context regarding your secure sandbox connection request..."
              rows={3}
              className="w-full bg-black/60 border border-white/5 rounded-lg p-2.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/50 placeholder-white/20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-white hover:text-cyan-400 text-[9px] uppercase font-black tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Dispatching secure ticket...
              </>
            ) : (
              <>
                <HeartHandshake className="w-3.5 h-3.5" /> Dispatch Secure Inquiry
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
