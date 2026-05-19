import React, { useState } from "react";
import { CalendarPlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addHours } from "date-fns";

export default function AddToCalendarButton({ contact }: any) {
  const [open, setOpen] = useState(false);

  const now = new Date();
  const start = addHours(now, 1);
  const end = addHours(now, 2);

  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const title = encodeURIComponent(`Meeting with ${contact.full_name}`);
  const details = encodeURIComponent(
    `Networking meeting with ${contact.full_name}${contact.company ? ` (${contact.company})` : ""}${contact.email ? `\nEmail: ${contact.email}` : ""}${contact.phone ? `\nPhone: ${contact.phone}` : ""}\n\nAdded via Neuro NetWorks`,
  );
  const location = encodeURIComponent(contact.met_at || "");

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${details}&location=${location}`;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 text-white/20 hover:text-cyan-400"
        title="Add to Calendar"
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarPlus className="w-4 h-4" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
            style={{
              background: "rgba(10,10,12,0.98)",
              backdropFilter: "blur(16px)",
            }}
          >
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <img
                src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_20_2x.png"
                className="w-4 h-4 object-contain"
                alt=""
              />
              Google Calendar
              <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
            </a>
            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors border-t border-white/5"
            >
              <img
                src="https://res.cdn.office.net/assets/mail/pwa/v1/images/logo.svg"
                className="w-4 h-4 object-contain"
                alt=""
              />
              Outlook Calendar
              <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
