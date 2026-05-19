import React from "react";
import { useUser } from "../lib/UserContext";
import CardPreview from "../components/CardPreview";
import { useNavigate } from "react-router-dom";
import { Sparkles, LayoutTemplate } from "lucide-react";

const TEMPLATES = [
  { id: "executive", name: "Executive", desc: "For C-suite & Leaders" },
  { id: "minimal", name: "Minimalist", desc: "Clean & Simple" },
  { id: "luxury_gold", name: "Luxury Gold", desc: "Premium & Exclusive" },
  { id: "corporate", name: "Corporate", desc: "Professional & Trustworthy" },
  { id: "creative", name: "Creative", desc: "Bold & Vibrant" },
  { id: "startup", name: "Startup", desc: "Modern & Energetic" },
  { id: "personal_brand", name: "Personal Brand", desc: "Focus on You" },
  { id: "finance", name: "Finance", desc: "Secure & Established" },
  { id: "healthcare", name: "Healthcare", desc: "Clean & Accessible" },
  { id: "academic", name: "Academic", desc: "Classic & Organized" },
];

export default function Templates() {
  const { profile, setProfile } = useUser();
  const navigate = useNavigate();

  const handleSelectTemplate = (templateId: string) => {
    setProfile(prev => ({ ...prev, template: templateId }));
    navigate("/card-builder");
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          Templates
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Choose a design tailored to your industry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES.map(t => (
          <div key={t.id} className="space-y-3">
            <div 
              className="group relative cursor-pointer"
              onClick={() => handleSelectTemplate(t.id)}
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
              <div className={`relative transition-all duration-300 ${profile.template === t.id ? 'ring-2 ring-cyan-400 rounded-2xl' : 'group-hover:scale-[1.02]'}`}>
                <div className="pointer-events-none">
                  <CardPreview card={{ ...profile, template: t.id }} compact={true} />
                </div>
                {profile.template === t.id && (
                  <div className="absolute top-2 right-2 bg-cyan-400 text-[#0a0a0c] text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">
                    Active
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {t.name}
                {profile.template === t.id && <Sparkles className="w-3 h-3 text-cyan-400" />}
              </h3>
              <p className="text-[10px] font-black tracking-widest uppercase text-white/40 mt-0.5">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Spacer */}
      <div className="h-10"></div>
    </div>
  );
}
