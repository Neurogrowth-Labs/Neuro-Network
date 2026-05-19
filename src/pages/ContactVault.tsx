import React, { useState } from "react";
import AIEnrichBadge from "../components/AIEnrichBadge";
import MessageGenerator from "../components/MessageGenerator";
import { Search, MapPin, Calendar, ListFilter, Plus, X, Brain, Loader2 } from "lucide-react";
import { MY_CARD } from "./Dashboard";
import AddToCalendarButton from "../components/AddToCalendarButton";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const INITIAL_CONTACTS = [
  {
    id: "c1",
    full_name: "Sarah Jenkins",
    job_title: "Partner",
    company: "Capital Ventures",
    industry: "Venture Capital",
    role_level: "executive",
    opportunity_type: "investor",
    contact_score: 92,
    ai_tags: ["fintech", "seed-stage", "networking"],
    ai_summary:
      "Target partner for Series A. Primarily interested in AI consumer apps based on recent investments.",
    met_at: "Web Summit 2024",
    notes:
      "Briefly chatted about our AI integration. Wanted to see traction numbers next quarter.",
    profile_photo: "https://i.pravatar.cc/150?u=sarah",
    follow_up_done: false,
    follow_up_date: new Date(Date.now() - 86400000).toISOString(), // Past date
  },
  {
    id: "c2",
    full_name: "David Chen",
    job_title: "SVP Engineering",
    company: "TechFlow",
    industry: "Enterprise Software",
    role_level: "executive",
    opportunity_type: "client",
    contact_score: 85,
    ai_tags: ["dev-tools", "enterprise", "b2b"],
    ai_summary: "Potential enterprise buyer for our team management tool.",
    met_at: "TechFlow CTO Dinner",
    notes:
      "Complained about standardizing dev environments across large teams.",
    profile_photo: "https://i.pravatar.cc/150?u=david",
    follow_up_done: true,
    follow_up_date: new Date(Date.now() - 86400000).toISOString(), // Past date
  },
  {
    id: "c3",
    full_name: "Elena Rodriguez",
    job_title: "Content Strategist",
    company: "Freelance",
    industry: "Media",
    role_level: "individual",
    opportunity_type: "media",
    contact_score: 65,
    ai_tags: ["marketing", "seo", "copy"],
    ai_summary: "Good contact for guest blogging opportunities.",
    met_at: "SF Creators Meetup",
    notes: "Good contact for guest blogging opportunities.",
    profile_photo: "https://i.pravatar.cc/150?u=elena",
    follow_up_done: false,
    follow_up_date: new Date(Date.now() + 86400000).toISOString(), // Future date
  },
];

export default function ContactVault() {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFollowUpOnly, setShowFollowUpOnly] = useState(false);
  const [newTagInput, setNewTagInput] = useState<{ [key: string]: string }>({});
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const handleAddTag = (contactId: string) => {
    const tag = newTagInput[contactId]?.trim();
    if (tag) {
      setContacts(
        contacts.map((c) =>
          c.id === contactId && !c.ai_tags.includes(tag)
            ? { ...c, ai_tags: [...c.ai_tags, tag] }
            : c,
        ),
      );
      setNewTagInput({ ...newTagInput, [contactId]: "" });
    }
  };

  const handleRemoveTag = (contactId: string, tagToRemove: string) => {
    setContacts(
      contacts.map((c) =>
        c.id === contactId
          ? { ...c, ai_tags: c.ai_tags.filter((t) => t !== tagToRemove) }
          : c,
      ),
    );
  };

  const aiEnrichContact = async (contact: any) => {
    setEnrichingId(contact.id);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this contact and provide insights:
Name: ${contact.full_name}
Title: ${contact.job_title}
Company: ${contact.company}
Notes: ${contact.notes}
        
Return strictly JSON with keys: 
ai_summary (1 insightful sentence on how they add value), 
ai_tags (array of 3 short keywords), 
contact_score (integer 0-100 indicating networking value based on seniority and relevance), 
role_level (one of: executive, manager, individual, other),
opportunity_type (one of: client, partner, investor, supplier, media, friend, other).`,
        response_json_schema: {
          type: "object",
          properties: {
            ai_summary: { type: "string" },
            ai_tags: { type: "array", items: { type: "string" } },
            contact_score: { type: "number" },
            role_level: { type: "string" },
            opportunity_type: { type: "string" }
          }
        }
      });
      
      setContacts(contacts.map(c => 
        c.id === contact.id ? { 
          ...c, 
          ai_summary: res.ai_summary, 
          ai_tags: res.ai_tags, 
          contact_score: res.contact_score, 
          role_level: res.role_level, 
          opportunity_type: res.opportunity_type 
        } : c
      ));
      toast.success("Contact successfully enriched!");
    } catch {
      toast.error("Failed to enrich contact.");
    }
    setEnrichingId(null);
  };

  const filteredContacts = contacts.filter((c) => {
    if (showFollowUpOnly) {
      return !c.follow_up_done && new Date(c.follow_up_date) < new Date();
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
            Contact Vault
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Smart networking and AI-enriched CRM.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="bg-transparent border-none outline-none text-sm font-medium tracking-tight text-white placeholder:text-white/30 w-full"
          />
        </div>

        <button
          onClick={() => setShowFollowUpOnly(!showFollowUpOnly)}
          className={`px-4 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
            showFollowUpOnly
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
              : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          Requires Follow-up
        </button>
      </div>

      <div className="space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="text-center p-8 bg-white/[0.02] border border-white/5 rounded-xl text-white/40">
            No contacts found for current filter.
          </div>
        ) : (
          filteredContacts.map((c) => {
            const isExpanded = expandedId === c.id;
            const isEnriching = enrichingId === c.id;

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
                    {!c.follow_up_done &&
                      new Date(c.follow_up_date) < new Date() && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest rounded">
                          Follow up
                        </span>
                      )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-6 border-t border-white/5 pt-5 bg-[#0a0a0c]/50">
                    {/* Neuro enrich */}
                    <div>
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                           <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Neuro Intelligence</span>
                           <button onClick={() => aiEnrichContact(c)} disabled={isEnriching} className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 transition-colors">
                              {isEnriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                              Enrich
                           </button>
                        </div>
                        <AIEnrichBadge contact={{ ...c, ai_tags: c.ai_tags.join(",") }} />
                    </div>

                    {/* AI Tags Section */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        AI Generated Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.ai_tags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs font-medium text-white/80"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => handleRemoveTag(c.id, tag)}
                              className="text-white/40 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1">
                          <input
                            type="text"
                            placeholder="Add tag..."
                            value={newTagInput[c.id] || ""}
                            onChange={(e) =>
                              setNewTagInput({
                                ...newTagInput,
                                [c.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTag(c.id);
                            }}
                            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-20"
                          />
                          <button
                            onClick={() => handleAddTag(c.id)}
                            className="text-white/40 hover:text-cyan-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

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

                    <div className="flex items-center gap-2">
                      <AddToCalendarButton contact={c} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Add to Calendar
                      </span>
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
          })
        )}
      </div>
    </div>
  );
}
