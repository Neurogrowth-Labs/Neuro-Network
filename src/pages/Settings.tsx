import React, { useState } from "react";
import { useUser } from "../lib/UserContext";
import { Save, User, Briefcase, Building, Mail, Phone, Globe, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { profile, setProfile } = useUser();
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // simulate network
    setTimeout(() => {
      setProfile(formData);
      setIsSaving(false);
      toast.success("Profile updated successfully");
    }, 600);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          Settings
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Configure your profile and preferences
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-cyan-400" /> Personal Information
        </h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-white/30" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Job Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-white/30" />
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="E.g. CEO"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Company</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-white/30" />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="Your company"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-cyan-400" /> Contact Details
        </h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-white/30" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-white/30" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Website</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-white/30" />
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="yourite.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-cyan-400" /> Bio & Summary
        </h2>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Short Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            placeholder="Tell people a bit about yourself..."
          ></textarea>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50"
      >
        {isSaving ? (
          <span className="w-4 h-4 border-2 border-[#0a0a0c] border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
      
      {/* spacer to make it scroll nicely over bottom nav */}
      <div className="h-10"></div>
    </div>
  );
}
