import React, { useRef } from "react";
import { useUser } from "../lib/UserContext";
import CardPreview from "../components/CardPreview";
import { Upload, Palette, LayoutTemplate, Briefcase, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  { id: "executive", name: "Executive" },
  { id: "minimal", name: "Minimalist" },
  { id: "luxury_gold", name: "Luxury Gold" },
  { id: "corporate", name: "Corporate" },
  { id: "creative", name: "Creative" },
  { id: "startup", name: "Startup" },
  { id: "personal_brand", name: "Personal Brand" },
  { id: "finance", name: "Finance" },
  { id: "healthcare", name: "Healthcare" },
  { id: "academic", name: "Academic" },
];

export default function CardBuilder() {
  const { profile, setProfile } = useUser();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdate(field, reader.result as string);
        toast.success("Image uploaded temporarily");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          Card Builder
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Design and customize your digital business card.
        </p>
      </div>

      <div className="relative">
        <CardPreview card={{ ...profile, profile_photo: profile.avatar_url || profile.profile_photo }} />
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <LayoutTemplate className="w-4 h-4 text-cyan-400" /> Templates & Identity
        </h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Select Template</label>
            <select
              value={profile.template}
              onChange={(e) => handleUpdate("template", e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Industry / Sector</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
              <input
                type="text"
                value={profile.industry}
                onChange={(e) => handleUpdate("industry", e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="E.g. Technology"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Branding Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={profile.theme_color}
                onChange={(e) => handleUpdate("theme_color", e.target.value)}
                className="w-10 h-10 rounded bg-transparent border-0 cursor-pointer"
              />
              <span className="text-white/60 text-sm font-mono">{profile.theme_color.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <ImageIcon className="w-4 h-4 text-cyan-400" /> Card Assets
        </h2>

        <div className="space-y-4">
          <div className="space-y-2 flex flex-col items-center justify-center p-6 border border-white/10 rounded-xl bg-white/[0.01]">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Profile Picture</span>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover shadow-xl border border-white/10" alt="Avatar" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white/40" />
              </div>
            )}
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wide px-3 py-1 bg-cyan-400/10 rounded"
            >
              Upload Profile Picture
            </button>
            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar_url')} accept=".png,.jpg,.jpeg" className="hidden" />
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center p-6 border border-white/10 rounded-xl bg-white/[0.01]">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Banner Image</span>
            {profile.banner_url ? (
              <img src={profile.banner_url} className="w-full h-24 object-cover rounded-xl shadow-xl border border-white/10" alt="Banner" />
            ) : (
              <div className="w-full h-16 rounded-xl bg-white/5 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white/40" />
              </div>
            )}
            <button 
              onClick={() => bannerInputRef.current?.click()}
              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wide px-3 py-1 bg-cyan-400/10 rounded"
            >
              Upload Banner Image
            </button>
            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileUpload(e, 'banner_url')} accept=".png,.jpg,.jpeg" className="hidden" />
          </div>
        </div>
      </div>
      
      {/* spacer to make it scroll nicely over bottom nav */}
      <div className="h-10"></div>
    </div>
  );
}
