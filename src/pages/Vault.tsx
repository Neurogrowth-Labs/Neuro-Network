import React, { useEffect, useState } from "react";
import AIEnrichBadge from "../components/AIEnrichBadge";
import MessageGenerator from "../components/MessageGenerator";
import {
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
} from "lucide-react";
import { MY_CARD } from "./Dashboard";
import AddToCalendarButton from "../components/AddToCalendarButton";
import BiometricVerification from "../components/BiometricVerification";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";

export default function Vault() {
  const { user } = useUser();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (!isUnlocked || !user?.id) return;

    let mounted = true;
    setLoadingContacts(true);
    const loadContacts = async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (mounted) {
        setContacts((data || []).map(normalizeContact));
        setLoadingContacts(false);
      }
    };

    loadContacts();

    const channel = supabase
      .channel("vault-contacts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts", filter: `user_id=eq.${user.id}` },
        () => {
          supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => mounted && setContacts((data || []).map(normalizeContact)));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [isUnlocked, user?.id]);

  if (!isUnlocked) {
    return (
      <div className="p-6">
        <BiometricVerification onUnlockSuccess={() => setIsUnlocked(true)} sectionName="Smart Vault" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          Contact Vault
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Smart networking and AI-enriched CRM.
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search contacts, companies, tags..."
          className="bg-transparent border-none outline-none text-sm font-medium tracking-tight text-white placeholder:text-white/30 w-full"
        />
      </div>

      <div className="space-y-4">
        {loadingContacts ? (
          <div className="text-center p-8 bg-white/[0.02] border border-white/5 rounded-xl text-white/40">
            Loading contacts from Supabase...
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center p-8 bg-white/[0.02] border border-white/5 rounded-xl text-white/40">
            No contacts saved yet.
          </div>
        ) : contacts.map((c) => {
          const isExpanded = expandedId === c.id;
          return (
            <div
              key={c.id}
              className={`bg-white/[0.02] border ${isExpanded ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5"} rounded-xl overflow-hidden transition-all duration-300`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={c.profile_photo}
                    className="w-12 h-12 rounded-full border border-white/10"
                    alt=""
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-base tracking-tight text-white">
                      {c.full_name}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-0.5">
                      {c.job_title} @ {c.company}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </div>
                {!isExpanded && <AIEnrichBadge contact={c} compact={true} />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-6 border-t border-white/5 pt-5 bg-[#0a0a0c]/50">
                  <AIEnrichBadge contact={c} compact={false} />

                  <div className="space-y-3 text-sm font-medium tracking-tight">
                    <p className="flex items-center gap-3 text-white/60">
                      <MapPin className="w-4 h-4 text-cyan-400" /> Met at:{" "}
                      {c.met_at}
                    </p>
                    <p className="flex items-start gap-3 text-white/60">
                      <Calendar className="w-4 h-4 text-cyan-400 mt-0.5" />{" "}
                      Notes: {c.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <AddToCalendarButton contact={c} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Add to Calendar
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => window.location.href = "/voice-call"} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-cyan-400 group"
                    >
                      <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Call Contact</span>
                    </button>
                  </div>

                  <div className="pt-5 border-t border-white/5">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">
                      AI Outreach Assistant
                    </p>
                    <MessageGenerator
                      contact={c}
                      senderName={MY_CARD.full_name}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
