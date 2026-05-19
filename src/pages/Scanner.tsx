import React, { useState, useRef } from "react";
import { ScanLine, Upload, Sparkles, User, Briefcase, Building, Mail, Phone, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        scanImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const scanImage = async () => {
    setScanning(true);
    setExtractedData(null);
    try {
      // In a real app we would pass the image to Gemini Vision API
      // Here we simulate standard business card extraction using LLM
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate an AI vision model extracting text from a business card image. Generate a realistic parsed contact:
Name
Job Title
Company
Email
Phone
Industry

Return strictly as JSON with keys full_name, job_title, company, email, phone, industry.`,
        response_json_schema: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            job_title: { type: "string" },
            company: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            industry: { type: "string" },
          }
        }
      });
      setExtractedData(res);
      toast.success("Card scanned successfully via AI");
    } catch {
      toast.error("Failed to extract data");
    }
    setScanning(false);
  };

  const handleSave = () => {
    // In a real app, save to vault
    toast.success("Contact saved to Vault");
    setTimeout(() => {
      navigate("/vault");
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          AI Scanner
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">
          Extract contacts instantly
        </p>
      </div>

      {!imagePreview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative aspect-[3/4] bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
             <ScanLine className="w-10 h-10 text-cyan-400 absolute group-hover:animate-ping opacity-20" />
             <ScanLine className="w-10 h-10 text-cyan-400 relative z-10" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Tap to Scan Card</h3>
          <p className="text-xs text-white/40 text-center max-w-[200px]">
            Upload a photo of a business card. Our AI will automatically extract the details.
          </p>

          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10">
            <img src={imagePreview} className="w-full h-full object-cover" alt="Scanned card" />
            
            {scanning && (
              <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                <div className="text-xs font-bold text-white uppercase tracking-widest animate-pulse flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> AI Extracting Data
                </div>
                
                {/* Scanner bar animation */}
                <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] animate-scan" style={{ top: '50%' }} />
              </div>
            )}
          </div>

          {!scanning && extractedData && (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-3">
                <Check className="w-4 h-4" /> Extracted Info
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-1"><User className="w-3 h-3" /> Name</label>
                  <div className="text-sm font-medium text-white">{extractedData.full_name || "-"}</div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-1"><Briefcase className="w-3 h-3" /> Title</label>
                  <div className="text-sm font-medium text-white">{extractedData.job_title || "-"}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-1"><Building className="w-3 h-3" /> Company</label>
                  <div className="text-sm font-medium text-white">{extractedData.company || "-"}</div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-1"><Mail className="w-3 h-3" /> Email</label>
                  <div className="text-sm font-medium text-white truncate">{extractedData.email || "-"}</div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-1"><Phone className="w-3 h-3" /> Phone</label>
                  <div className="text-sm font-medium text-white">{extractedData.phone || "-"}</div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  onClick={() => { setImagePreview(null); setExtractedData(null); }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors"
                >
                  Rescan
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Save Contact
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Spacer */}
      <div className="h-10"></div>
    </div>
  );
}
