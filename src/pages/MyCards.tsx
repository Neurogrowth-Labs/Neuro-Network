import React, { useState } from "react";
import { useUser } from "../lib/UserContext";
import CardPreview from "../components/CardPreview";
import { Edit, Share2, Plus, GripVertical, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MyCards() {
  const { profile, setProfile } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
    toast.success("Card updated successfully");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
            My Cards
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Manage your digital identities
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative group transition-all">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-white/20" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Primary Card</span>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/card-view")} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="pointer-events-none mb-4">
             <CardPreview card={{ ...formData, profile_photo: formData.avatar_url || formData.profile_photo }} compact={true} />
          </div>

          {isEditing ? (
             <div className="space-y-4 border-t border-white/5 pt-4">
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</label>
                   <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Job Title</label>
                   <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Company</label>
                   <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
                   <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                 </div>
               </div>
               
               <div className="flex gap-2 pt-2">
                 <button onClick={() => navigate("/card-builder")} className="flex-1 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                   <LayoutTemplate className="w-4 h-4" /> Design
                 </button>
                 <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                   Cancel
                 </button>
                 <button onClick={handleSave} className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                   Save
                 </button>
               </div>
             </div>
          ) : (
            <div className="flex gap-2">
               <button onClick={() => navigate("/card-builder")} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                 <LayoutTemplate className="w-4 h-4" /> Edit Design
               </button>
            </div>
          )}
        </div>

        <button onClick={() => toast.info("Premium feature: Multiple cards")} className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
          <Plus className="w-8 h-8 mb-2" />
          <span className="text-sm font-bold tracking-tight">Create Another Card</span>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-50">Pro Feature</span>
        </button>
      </div>

      <div className="h-10"></div>
    </div>
  );
}
