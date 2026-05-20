import React from "react";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Instagram,
  Twitter,
  MessageCircle,
  Calendar,
  Briefcase,
} from "lucide-react";

const templateStyles: any = {
  executive: {
    bg: "bg-[#0a0a0c]",
    accent: "text-white",
    border: "border-white/10",
  },
  minimal: {
    bg: "bg-white",
    accent: "text-[#0a0a0c]",
    border: "border-white/20",
  },
  luxury_gold: {
    bg: "bg-[#1a1a24]",
    accent: "text-amber-400",
    border: "border-amber-500/20",
  },
  corporate: {
    bg: "bg-[#0d1117]",
    accent: "text-blue-400",
    border: "border-white/10",
  },
  creative: {
    bg: "bg-[#110e14]",
    accent: "text-pink-400",
    border: "border-pink-500/20",
  },
  startup: {
    bg: "bg-[#0a1412]",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  personal_brand: {
    bg: "bg-[#140a0a]",
    accent: "text-orange-400",
    border: "border-orange-500/20",
  },
  finance: {
    bg: "bg-[#081a26]",
    accent: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  healthcare: {
    bg: "bg-[#f8fafc]",
    accent: "text-blue-600",
    border: "border-blue-500/20",
  },
  academic: {
    bg: "bg-[#27272a]",
    accent: "text-yellow-500",
    border: "border-yellow-500/20",
  },
};

const isDarkTemplate = (template: string) => !["minimal", "healthcare"].includes(template);

export default function CardPreview({ card, compact = false }: any) {
  const style = templateStyles[card.template] || templateStyles.luxury_gold;
  const dark = isDarkTemplate(card.template);
  const textColor = dark ? "text-white" : "text-slate-900";
  const subColor = dark ? "text-white/60" : "text-slate-500";
  const iconColor = dark ? "text-white/40" : "text-slate-400";

  if (compact) {
    return (
      <div
        className={`${style.bg} rounded-2xl p-4 sm:p-5 border ${style.border} relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-cyan-400/50 cursor-pointer`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center gap-4">
          {card.profile_photo ? (
            <img
              src={card.profile_photo}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
              alt=""
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl flex-shrink-0 ${dark ? "bg-white/5" : "bg-slate-100"} flex items-center justify-center text-lg font-light tracking-tighter ${style.accent}`}
            >
              {card.full_name?.[0] || "?"}
            </div>
          )}
          <div className="min-w-0">
            <h3
              className={`font-bold text-base tracking-tight truncate ${textColor}`}
            >
              {card.full_name || "Your Name"}
            </h3>
            <p
              className={`text-[10px] font-black uppercase tracking-widest mt-0.5 truncate ${subColor}`}
            >
              {card.job_title || "Job Title"}
            </p>
            {card.company && (
              <p
                className={`text-[10px] font-black uppercase tracking-widest mt-0.5 truncate ${subColor} opacity-70`}
              >
                {card.company}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const socialLinks = [
    { value: card.linkedin, icon: Linkedin, label: "LinkedIn" },
    { value: card.instagram, icon: Instagram, label: "Instagram" },
    { value: card.twitter, icon: Twitter, label: "Twitter" },
    { value: card.whatsapp, icon: MessageCircle, label: "WhatsApp" },
    { value: card.calendly, icon: Calendar, label: "Calendly" },
    { value: card.portfolio, icon: Briefcase, label: "Portfolio" },
  ].filter((s) => s.value);

  return (
    <div
      className={`${style.bg} rounded-3xl border ${style.border} overflow-hidden max-w-sm mx-auto shadow-2xl`}
    >
      <div className="h-28 relative overflow-hidden">
        {card.banner_url ? (
          <img src={card.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${card.theme_color || "#06b6d4"}20, transparent 40%, ${card.theme_color || "#06b6d4"}10)`,
            }}
          />
        )}
        {card.company_logo && (
          <img
            src={card.company_logo}
            className="absolute top-6 right-6 h-8 opacity-60"
            alt=""
          />
        )}
      </div>

      <div className="px-8 -mt-14 relative flex justify-between items-end">
        {card.profile_photo ? (
          <img
            src={card.profile_photo}
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#0a0a0c] shadow-xl"
            alt=""
          />
        ) : (
          <div
            className={`w-24 h-24 rounded-2xl ${dark ? "bg-white/5" : "bg-slate-100"} flex items-center justify-center text-4xl font-light tracking-tighter ${style.accent} ring-4 ring-[#0a0a0c]`}
          >
            {card.full_name?.[0] || "?"}
          </div>
        )}
        <div className="pb-2 text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-cyan-400 mb-0.5">
            {card.template.replace("_", " ")}
          </p>
          <p className="text-[8px] font-bold tracking-widest uppercase text-white/30">
            ID: NN-002495
          </p>
        </div>
      </div>

      <div className="px-8 pt-6 pb-8">
        <div>
          <h2 className={`text-3xl font-light tracking-tighter ${textColor}`}>
            {card.full_name || "Your Name"}
          </h2>
          <p
            className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${style.accent}`}
          >
            {card.job_title || "Job Title"}
          </p>
          {card.company && (
            <p
              className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${subColor}`}
            >
              {card.company}
            </p>
          )}
        </div>

        {card.bio && (
          <p
            className={`text-sm tracking-tight font-medium ${subColor} italic border-l-2 border-white/10 pl-4 py-1 mt-6 leading-relaxed`}
          >
            "{card.bio}"
          </p>
        )}

        <div className="space-y-3 mt-6 pt-6 border-t border-white/5">
          {[
            { v: card.email, i: Mail },
            { v: card.phone, i: Phone },
            { v: card.website, i: Globe },
            { v: card.address, i: MapPin },
          ]
            .filter((x) => x.v)
            .map((x, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <x.i className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <p
                  className={`text-sm tracking-tight font-medium ${textColor} truncate`}
                >
                  {x.v}
                </p>
              </div>
            ))}
        </div>

        {socialLinks.length > 0 && (
          <div className="flex gap-3 pt-6 mt-6 border-t border-white/5">
            {socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.value}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-cyan-400 hover:border-cyan-400 hover:text-[#0a0a0c] transition-all group ${textColor}`}
              >
                <s.icon
                  className={`w-4 h-4 ${iconColor} group-hover:text-[#0a0a0c] transition-colors`}
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
