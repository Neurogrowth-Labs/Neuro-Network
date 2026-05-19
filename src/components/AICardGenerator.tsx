import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Loader2,
  Palette,
  Type,
  Wand2,
  Check,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PALETTE_DOTS = (colors: string[]) => (
  <div className="flex gap-1">
    {colors.map((c, i) => (
      <div
        key={i}
        className="w-5 h-5 rounded-full border border-white/10"
        style={{ background: c }}
      />
    ))}
  </div>
);

export default function AICardGenerator({ card, onApply }: any) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    card.logo_url || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast.success("Logo uploaded temporarily");
      };
      reader.readAsDataURL(file);
    }
  };

  const generate = async () => {
    if (!card.full_name && !description) {
      toast.error("Add a name or description first");
      return;
    }
    setLoading(true);
    setSuggestions(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a premium brand design AI. Design 3 distinct business card concepts for this professional:

Name: ${card.full_name || "Unknown"}
Title: ${card.job_title || "Unknown"}
Company: ${card.company || ""}
Description/Interests: ${description || "Professional networking card"}

For each concept, suggest:
- A card template from: executive, minimal, luxury_gold, corporate, creative, startup, personal_brand
- A primary accent hex color (bold, memorable)
- A secondary color for contrast
- A background color (dark preferred)
- A font_style from: modern, classic, bold, elegant
- A short bio (1 sentence, compelling, role-specific)
- A concept_name (2-3 words, e.g. "Midnight Executive")
- A concept_rationale (1 sentence why this fits their role/personality)

Return JSON strictly.`,
      response_json_schema: {
        type: "object",
        properties: {
          concepts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                concept_name: { type: "string" },
                concept_rationale: { type: "string" },
                template: { type: "string" },
                theme_color: { type: "string" },
                secondary_color: { type: "string" },
                bg_color: { type: "string" },
                font_style: { type: "string" },
                bio: { type: "string" },
              },
            },
          },
        },
      },
    });
    setSuggestions(res?.concepts || []);
    setLoading(false);
  };

  const apply = (concept: any) => {
    onApply({
      template: concept.template,
      theme_color: concept.theme_color,
      font_style: concept.font_style,
      bio: concept.bio,
    });
    toast.success(`Applied "${concept.concept_name}" design`);
  };

  return (
    <div className="space-y-5">
      <div
        className="flex items-start gap-3 p-4 rounded-xl border border-cyan-500/20"
        style={{
          background:
            "linear-gradient(135deg,rgba(6,182,212,0.05),rgba(8,145,178,0.03))",
        }}
      >
        <Wand2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-cyan-300">AI Design Generator</p>
          <p className="text-xs text-white/40 mt-0.5">
            Describe your style, industry, or personality and AI will generate 3
            tailored card designs with color palettes and typography.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">
          Describe your vibe, industry, or interests (optional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. I'm a fintech founder who values minimalism and luxury. I attend crypto conferences and VC pitches..."
          className="bg-transparent border-white/10 text-white placeholder:text-white/30 min-h-[100px] resize-none focus:border-cyan-500/50 text-sm font-medium tracking-tight"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">
          Upload Business Logo
        </label>
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-cyan-500/30 transition-colors bg-white/[0.01]">
          {logoPreview ? (
            <div className="relative group rounded overflow-hidden flex flex-col items-center">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-16 object-contain mb-3"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wide px-3 py-1 bg-cyan-400/10 rounded"
              >
                Change Logo
              </button>
            </div>
          ) : (
            <div
              className="text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 mx-auto bg-white/5 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors mb-3">
                <Upload className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-xs text-white/60 font-medium cursor-pointer hover:text-white">
                Click to upload logo
              </p>
              <p className="text-[10px] text-white/30 mt-1">
                PNG, JPG up to 2MB
              </p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept=".png,.jpg,.jpeg"
            className="hidden"
          />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-black text-xs uppercase tracking-widest text-[#0a0a0c] bg-white disabled:opacity-50 transition-all hover:bg-cyan-400"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading ? "Generating designs…" : "Generate AI Designs"}
      </button>

      {suggestions && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
            AI Concepts — Pick one to apply
          </p>
          {suggestions.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 overflow-hidden hover:border-cyan-500/30 transition-all group bg-white/[0.02]"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold tracking-tight text-white">
                      {c.concept_name}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                      {c.concept_rationale}
                    </p>
                  </div>
                  <button
                    onClick={() => apply(c)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#0a0a0c] bg-white flex-shrink-0 transition-all hover:bg-cyan-400"
                  >
                    <Check className="w-3 h-3" /> Apply
                  </button>
                </div>

                <div className="flex items-center gap-4 flex-wrap border-y border-white/5 py-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-white/20" />
                    {PALETTE_DOTS(
                      [c.theme_color, c.secondary_color, c.bg_color].filter(
                        Boolean,
                      ),
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                      {c.theme_color}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                      {c.font_style}
                    </span>
                  </div>
                  <span className="text-[9px] font-black px-2 py-1 rounded bg-white/5 text-white/40 uppercase tracking-widest">
                    {c.template?.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-sm font-medium tracking-tight text-white/60 italic border-l-2 border-cyan-500/30 pl-3 leading-relaxed">
                  {c.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
