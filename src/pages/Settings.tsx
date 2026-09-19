import React, { useState } from "react";
import { useUser } from "../lib/UserContext";
import { Save, User, Briefcase, Building, Mail, Phone, Globe, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { profile, setProfile } = useUser();
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize form fields whenever the saved profile loads or updates
  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setProfile(formData);
      setIsSaving(false);
      toast.success("Profile updated successfully");
    }, 600);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Page Title Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
          Configure your profile and preferences
        </p>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-5 space-y-6 shadow-sm dark:shadow-none transition-colors">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400" /> Personal Information
        </h2>

        <div className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-white/30" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ""}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Job Title Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Job Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title || ""}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                  placeholder="E.g. CEO"
                />
              </div>
            </div>

            {/* Company Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Company</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  name="company"
                  value={formData.company || ""}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                  placeholder="Your company"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details Section */}
      <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-5 space-y-6 shadow-sm dark:shadow-none transition-colors">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400" /> Contact Details
        </h2>

        <div className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-white/30" />
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-white/30" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Website Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Website</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                  placeholder="yoursite.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-5 space-y-6 shadow-sm dark:shadow-none transition-colors">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400" /> Bio & Summary
        </h2>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 ml-1">Short Bio</label>
          <textarea
            name="bio"
            value={formData.bio || ""}
            onChange={handleChange}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 dark:bg-[#0a0a0c] dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0a66c2] dark:focus:border-cyan-500/50 transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-white/30"
            placeholder="Tell people a bit about yourself..."
          ></textarea>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#0a66c2] hover:bg-[#084e96] dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-[#0a0a0c] font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
      >
        {isSaving ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
      
      <div className="h-10"></div>
    </div>
  );
}
