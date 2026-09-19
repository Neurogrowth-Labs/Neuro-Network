import React, { useState } from "react";
import { Radar, MapPin, Users, Settings, UserPlus, Check, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ProximityAlerts() {
  const [radius, setRadius] = useState(500);
  const [autoConnect, setAutoConnect] = useState(false);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [scanning, setScanning] = useState(true);
  
  const [nearbyUsers, setNearbyUsers] = useState<Array<{ id: number; name: string; role: string; distance: string; matched: boolean; connected: boolean }>>([]);

  const toggleConnect = (id: number) => {
    setNearbyUsers(users => users.map(u => {
      if (u.id === id) {
        if (!u.connected) toast.success(`Connected with ${u.name}`);
        return { ...u, connected: !u.connected };
      }
      return u;
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-slate-900 dark:text-white mb-2">
          Proximity Tools
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#0a66c2] dark:text-cyan-400/80">
          Advanced localized networking
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nearby Active Card */}
        <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-400/10 flex items-center justify-center relative">
             {scanning && <div className="absolute inset-0 rounded-full border border-[#0a66c2] dark:border-cyan-400 animate-ping opacity-20" />}
             <Radar className={`w-5 h-5 text-[#0a66c2] dark:text-cyan-400 ${scanning ? 'animate-spin-slow' : ''}`} />
          </div>
          <span className="text-2xl font-light text-slate-900 dark:text-white">{nearbyUsers.length}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Nearby Active</span>
        </div>
        
        {/* High Match Card */}
        <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 shadow-sm dark:shadow-none transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
             <Activity className="w-5 h-5 text-slate-600 dark:text-white/60" />
          </div>
          <span className="text-2xl font-light text-slate-900 dark:text-white">
             {nearbyUsers.filter(u => u.matched).length}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">High Match</span>
        </div>
      </div>

      {/* Discovery Settings Panel */}
      <div className="bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 p-5 rounded-2xl space-y-5 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#0a66c2] dark:text-cyan-400" /> Discovery Settings
          </h2>
        </div>
        
        <div className="space-y-4">
          {/* Discovery Radius Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60">Discovery Radius</label>
              <span className="text-xs font-bold text-[#0a66c2] dark:text-cyan-400">{radius} meters</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="2000" 
              step="100"
              value={radius} 
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-[#0a66c2] dark:accent-cyan-400 bg-slate-200 dark:bg-white/10 rounded-full h-1 appearance-none cursor-pointer"
            />
          </div>

          {/* Auto-Connect Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-slate-900 dark:text-white">Auto-Connect</div>
              <div className="text-[10px] text-slate-500 dark:text-white/40">Automatically connect with high AI matches</div>
            </div>
            <button 
              onClick={() => setAutoConnect(!autoConnect)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${autoConnect ? 'bg-[#0a66c2] dark:bg-cyan-400' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${autoConnect ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Alert on Match Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-slate-900 dark:text-white">Alert on Match</div>
              <div className="text-[10px] text-slate-500 dark:text-white/40">Push notification when match enters radius</div>
            </div>
            <button 
              onClick={() => setNotifyMatches(!notifyMatches)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${notifyMatches ? 'bg-[#0a66c2] dark:bg-cyan-400' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${notifyMatches ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Detected Network Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center justify-between px-2">
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Detected Network</span>
          <button onClick={() => setScanning(!scanning)} className="text-[9px] text-[#0a66c2] hover:text-[#084e96] dark:text-cyan-400 dark:hover:text-cyan-300 font-bold tracking-widest cursor-pointer">
             {scanning ? "PAUSE" : "RESUME"}
          </button>
        </h2>

        <div className="space-y-3">
          {nearbyUsers.length === 0 ? (
            <div className="text-center p-8 bg-white border border-slate-200 dark:bg-white/[0.02] dark:border-white/5 rounded-xl text-slate-500 dark:text-white/40 font-medium text-sm">
              Scanning for nearby contacts...
            </div>
          ) : (
            nearbyUsers.map(user => (
              <div key={user.id} className="bg-white border border-slate-200 hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-4 flex items-center justify-between group dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-blue-500/20 border border-cyan-200 dark:border-white/10 flex items-center justify-center font-bold text-[#0a66c2] dark:text-white text-sm relative">
                    {user.name.substring(0, 1)}
                    {user.matched && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#0a66c2] dark:bg-cyan-400 rounded-full border-2 border-white dark:border-[#0a0a0c]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {user.name} 
                      {user.matched && <span className="text-[8px] bg-cyan-100 text-[#0a66c2] dark:bg-cyan-400/20 dark:text-cyan-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">AI Match</span>}
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-white/50">{user.role}</p>
                    <p className="text-[10px] text-slate-400 dark:text-white/30 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {user.distance} • active now
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => toggleConnect(user.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    user.connected 
                      ? 'bg-[#0a66c2] text-white dark:bg-cyan-500 dark:text-[#0a0a0c]' 
                      : 'bg-slate-100 text-slate-700 hover:bg-[#0a66c2] hover:text-white dark:bg-white/5 dark:text-white dark:hover:bg-cyan-500 dark:hover:text-[#0a0a0c]'
                  }`}
                >
                   {user.connected ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="h-10"></div>
    </div>
  );
}
