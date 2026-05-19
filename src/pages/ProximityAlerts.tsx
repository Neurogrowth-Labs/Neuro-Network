import React, { useState } from "react";
import { Radar, MapPin, Users, Settings, Bell, UserPlus, Check, SlidersHorizontal, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ProximityAlerts() {
  const [radius, setRadius] = useState(500);
  const [autoConnect, setAutoConnect] = useState(false);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [scanning, setScanning] = useState(true);
  
  const [nearbyUsers, setNearbyUsers] = useState([
    { id: 1, name: "Sarah Jenkins", role: "VP of Engineering at TechGlobal", distance: "50m", matched: true, connected: false },
    { id: 2, name: "David Chen", role: "Product Designer", distance: "120m", matched: false, connected: true },
    { id: 3, name: "Amanda Lewis", role: "Startup Founder", distance: "300m", matched: true, connected: false },
    { id: 4, name: "James Wilson", role: "Venture Capitalist", distance: "450m", matched: true, connected: false }
  ]);

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
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          Proximity Tools
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">
          Advanced localized networking
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 rounded-full bg-cyan-400/10 flex items-center justify-center relative">
             {scanning && <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-20" />}
             <Radar className={`w-5 h-5 text-cyan-400 ${scanning ? 'animate-spin-slow' : ''}`} />
          </div>
          <span className="text-2xl font-light text-white">{nearbyUsers.length}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Nearby Active</span>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
             <Activity className="w-5 h-5 text-white/60" />
          </div>
          <span className="text-2xl font-light text-white">
             {nearbyUsers.filter(u => u.matched).length}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">High Match</span>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" /> Discovery Settings
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Discovery Radius</label>
              <span className="text-xs font-bold text-cyan-400">{radius} meters</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="2000" 
              step="100"
              value={radius} 
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-cyan-400 bg-white/10 rounded-full h-1 appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-white">Auto-Connect</div>
              <div className="text-[10px] text-white/40">Automatically connect with high AI matches</div>
            </div>
            <button 
              onClick={() => setAutoConnect(!autoConnect)}
              className={`w-10 h-5 rounded-full transition-colors relative ${autoConnect ? 'bg-cyan-400' : 'bg-white/10'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${autoConnect ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-white">Alert on Match</div>
              <div className="text-[10px] text-white/40">Push notification when match enters radius</div>
            </div>
            <button 
              onClick={() => setNotifyMatches(!notifyMatches)}
              className={`w-10 h-5 rounded-full transition-colors relative ${notifyMatches ? 'bg-cyan-400' : 'bg-white/10'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${notifyMatches ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center justify-between px-2">
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Detected Network</span>
          <button onClick={() => setScanning(!scanning)} className="text-[9px] text-cyan-400 hover:text-cyan-300">
             {scanning ? "PAUSE" : "RESUME"}
          </button>
        </h2>

        <div className="space-y-3">
          {nearbyUsers.map(user => (
            <div key={user.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-white text-sm relative">
                  {user.name.substring(0, 1)}
                  {user.matched && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border border-[#0a0a0c]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {user.name} 
                    {user.matched && <span className="text-[8px] bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">AI Match</span>}
                  </h3>
                  <p className="text-[10px] text-white/50">{user.role}</p>
                  <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {user.distance} • active now
                  </p>
                </div>
              </div>

              <button 
                onClick={() => toggleConnect(user.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${user.connected ? 'bg-cyan-500 text-[#0a0a0c]' : 'bg-white/5 text-white hover:bg-cyan-500 hover:text-[#0a0a0c]'}`}
              >
                 {user.connected ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-10"></div>
    </div>
  );
}
