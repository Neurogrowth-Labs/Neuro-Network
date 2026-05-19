import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Mail,
  Phone,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const MSG_TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "linkedin", label: "LinkedIn DM", icon: Linkedin },
  { value: "whatsapp", label: "WhatsApp", icon: Phone },
  { value: "sms", label: "SMS", icon: MessageSquare },
];

export default function MessageGenerator({ contact, senderName }: any) {
  const [msgType, setMsgType] = useState("email");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional ${msgType} follow-up message from ${senderName || "me"} to ${contact.full_name}.
Contact details:
- Name: ${contact.full_name}
- Job Title: ${contact.job_title || "unknown"}
- Company: ${contact.company || "unknown"}
- Industry: ${contact.industry || "unknown"}
- Met at: ${contact.met_at || "a networking event"}
- Notes: ${contact.notes || contact.meeting_notes || "none"}
- Opportunity type: ${contact.opportunity_type || "general networking"}

Write a warm, professional, concise message appropriate for ${msgType}. Do not add subject line for WhatsApp/SMS/LinkedIn. For email include a subject line prefixed with "Subject: ". Keep it authentic and not too salesy.`,
      });
      setMessage(res);
    } catch {
      toast.error("Failed to generate message");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={msgType} onValueChange={setMsgType}>
          <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white/80 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
            {MSG_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-sm">
                <span className="flex items-center gap-2">
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={generate}
          disabled={loading}
          className="bg-white hover:bg-cyan-400 text-[#0a0a0c] font-black tracking-widest uppercase text-[10px] h-9 px-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate
            </>
          )}
        </Button>
      </div>

      {message && (
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-4 text-sm text-white/80 leading-relaxed resize-none min-h-[180px] focus:outline-none focus:border-cyan-500/40"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={copy}
            className="absolute top-2 right-2 h-7 w-7 text-white/30 hover:text-white/70"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
