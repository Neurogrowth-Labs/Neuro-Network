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
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";
import { useNavigate } from "react-router-dom";

const normalizeContact = (contact: any) => ({
  ...contact,
  full_name: contact.full_name || contact.name || "Unknown contact",
  job_title: contact.job_title || contact.title || "",
  company: contact.company || "",
  profile_photo:
    contact.profile_photo ||
    contact.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      contact.full_name || contact.name || "Contact",
    )}`,
  met_at: contact.met_at || contact.location || "Unknown location",
  notes: contact.notes || "No notes yet.",
  ai_tags: Array.isArray(contact.ai_tags)
    ? contact.ai_tags
    : typeof contact.ai_tags === "string" && contact.ai_tags.length > 0
    ? contact.ai_tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter(Boolean)
    : [],
  follow_up_done: Boolean(contact.follow_up_done),
  follow_up_date: contact.follow_up_date || new Date(0).toISOString(),
  contact_score: Number(contact.contact_score || 0),
});

export default function Vault() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.id) return;

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
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(
              ({ data }) =>
                mounted && setContacts((data || []).map(normalizeContact)),
            );
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.job_title.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.met_at.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-slate-900 dark:text-white mb-2">
          Contact Vault
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
          Smart networking and AI-enriched CRM.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors shadow-sm dark:shadow-none">
        <Search className="w-4 h-4 text-slate-400 dark:text-white/30 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts, companies, tags..."
          className="bg-transparent border-none outline-none text-sm font-medium tracking-tight text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 w-full"
        />
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {loadingContacts ? (
          <div className="text-center p-8 bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl text-slate-500 dark:text-white/40 font-medium text-sm">
            Loading contacts from Supabase...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center p-8 bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl text-slate-500 dark:text-white/40 font-medium text-sm">
            {contacts.length === 0
              ? "No contacts saved yet."
              : "No contacts match your search."}
          </div>
        ) : (
          filteredContacts.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                  isExpanded
                    ? "bg-cyan-50/50 border-cyan-200 dark:border-cyan-500/30 dark:bg-cyan-500/5 shadow-sm dark:shadow-none"
                    : "bg-white border-slate-200 hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/5"
                }`}
              >
                {/* Contact Card Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={c.profile_photo}
                      className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 object-cover"
                      alt={c.full_name}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate">
                        {c.full_name}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mt-0.5 truncate">
                        {c.job_title} {c.company ? `@ ${c.company}` : ""}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/30 flex-shrink-0" />
                    )}
                  </div>
                  {!isExpanded && <AIEnrichBadge contact={c} compact={true} />}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-6 border-t border-slate-200 dark:border-white/5 pt-5 bg-slate-50/80 dark:bg-[#0a0a0c]/50">
                    <AIEnrichBadge contact={c} compact={false} />

                    <div className="space-y-3 text-sm font-medium tracking-tight">
                      <p className="flex items-center gap-3 text-slate-700 dark:text-white/60">
                        <MapPin className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400 flex-shrink-0" />{" "}
                        <span>Met at: {c.met_at}</span>
                      </p>
                      <p className="flex items-start gap-3 text-slate-700 dark:text-white/60">
                        <Calendar className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400 mt-0.5 flex-shrink-0" />{" "}
                        <span>Notes: {c.notes}</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <AddToCalendarButton contact={c} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                          Add to Calendar
                        </span>
                      </div>

                      <button
                        onClick={() => navigate("/voice-call")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100/70 border border-cyan-300 hover:bg-cyan-200/80 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:hover:bg-cyan-500/20 transition-all text-[#0a66c2] dark:text-cyan-400 group cursor-pointer"
                      >
                        <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Call Contact
                        </span>
                      </button>
                    </div>

                    {/* AI Assistant Sub-section */}
                    <div className="pt-5 border-t border-slate-200 dark:border-white/5">
                      <p className="text-[10px] font-black text-[#0a66c2] dark:text-cyan-400 uppercase tracking-widest mb-4">
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
          })
        )}
      </div>
    </div>
  );
}
