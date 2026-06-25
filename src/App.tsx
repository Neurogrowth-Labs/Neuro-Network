import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import {
  Shield,
  BrainCircuit,
  Contact,
  QrCode,
  Zap,
  Bell,
  User as UserIcon,
  Settings as SettingsIcon,
  MessageCircle,
  Menu,
  X,
  Video,
  MessageSquare
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { UserProvider, useUser } from "./lib/UserContext";
import { AdminStateProvider, useAdminState } from "./lib/AdminStateProvider";

// Pages
import Dashboard from "./pages/Dashboard";
import GoogleMeet from "./pages/GoogleMeet";
import GoogleChat from "./pages/GoogleChat";
import Vault from "./pages/Vault";
import Editor from "./pages/Editor";
import Admin from "./pages/Admin";
import AINetworking from "./pages/AINetworking";
import Analytics from "./pages/Analytics";
import CardBuilder from "./pages/CardBuilder";
import CardView from "./pages/CardView";
import Checkout from "./pages/Checkout";
import ContactVault from "./pages/ContactVault";
import CRMIntegration from "./pages/CRMIntegration";
import GeoMap from "./pages/GeoMap";
import Landing from "./pages/Landing";
import MyCards from "./pages/MyCards";
import Pricing from "./pages/Pricing";
import ProximityAlerts from "./pages/ProximityAlerts";
import Scanner from "./pages/Scanner";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Templates from "./pages/Templates";
import VoiceCall from "./pages/VoiceCall";

const queryClient = new QueryClient();

function TopNav() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const { profile, logout } = useUser();
  const isAdmin = profile?.role === 'super_admin' || profile?.email === 'lusimadio12@gmail.com' || profile?.email === 'simao@neurogrowthlabs.co.za';
  const [notifications, setNotifications] = useState([
    { id: 1, type: "message", text: "Sarah Jenkins connected with you.", time: "10m ago" },
    { id: 2, type: "system", text: "Your profile visibility was updated.", time: "1h ago" },
  ]);

  const tabs = [
    { path: "/", icon: QrCode, label: "Dashboard" },
    { path: "/vault", icon: Contact, label: "Vault" },
    { path: "/editor", icon: Zap, label: "AI Studio" },
    { path: "/chat", icon: MessageSquare, label: "Google Chat" },
    { path: "/meet", icon: Video, label: "Google Meet" },
  ];

  useEffect(() => {
    // Simulate incoming real-time notifications
    const timer = setTimeout(() => {
      setNotifications(prev => [
        { id: Date.now(), type: "message", text: "David Chen left a comment on your card.", time: "Just now" },
        ...prev
      ]);
    }, 15000); // 15 seconds after load

    // Listen to Supabase Realtime broadcast and insert events
    const handleRealtimeNotif = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newNotif = customEvent.detail;
      if (newNotif) {
        setNotifications(prev => [
          { id: newNotif.id || Date.now(), type: "system", text: newNotif.content, time: "Just now" },
          ...prev
        ]);
      }
    };

    const handleGlobalBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const payload = customEvent.detail;
      if (payload) {
        setNotifications(prev => [
          { id: Date.now(), type: "system", text: `[BROADCAST] ${payload.subject}: ${payload.body}`, time: "Just now" },
          ...prev
        ]);
      }
    };

    window.addEventListener("realtime-notification-received", handleRealtimeNotif);
    window.addEventListener("admin-global-broadcast", handleGlobalBroadcast);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("realtime-notification-received", handleRealtimeNotif);
      window.removeEventListener("admin-global-broadcast", handleGlobalBroadcast);
    };
  }, []);

  return (
    <div className="fixed top-0 w-full md:w-[400px] h-16 bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            setShowMobileMenu(!showMobileMenu);
            setShowNotifications(false);
            setShowProfileMenu(false);
          }}
          className="text-white/50 hover:text-white transition-colors p-1"
        >
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" onError={(e) => e.currentTarget.src = '/logo.png'} className="w-8 h-8 rounded-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] object-cover bg-white p-0.5" />
          <span className="font-bold text-sm tracking-tighter uppercase text-white truncate max-w-[100px] sm:max-w-none">
            Neuro NetWorks
          </span>
        </div>
      </div>

      {showMobileMenu && (
        <div className="absolute left-4 top-16 w-48 bg-[#12121a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          <div className="p-2 flex flex-col gap-1">
            {tabs.map((t) => {
              const active = location.pathname === t.path;
              return (
                <Link
                  key={t.path}
                  to={t.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${active ? "bg-cyan-500/10 text-cyan-400 font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <t.icon className={`w-4 h-4 ${active ? "drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" : ""}`} />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 relative">
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }} 
            className="relative text-white/50 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0c]"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-12 w-64 bg-[#12121a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
              <div className="p-3 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Notifications</span>
                <span className="text-[10px] text-cyan-400 cursor-pointer" onClick={() => setNotifications([])}>Mark all read</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/40">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                      <div className="mt-1">
                        {n.type === "message" ? <MessageCircle className="w-4 h-4 text-cyan-400" /> : <Bell className="w-4 h-4 text-white/40" />}
                      </div>
                      <div>
                        <div className="text-xs text-white/80 font-medium">{n.text}</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">{n.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-white/50 tracking-widest uppercase hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            {profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'ME'}
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-48 bg-[#12121a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
              <div className="p-2 flex flex-col gap-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors font-semibold border-b border-white/5 mb-1"
                  >
                    <Shield className="w-4 h-4" /> Admin Console
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <UserIcon className="w-4 h-4" /> Edit Profile
                </Link>
                <Link
                  to="/my-cards"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Contact className="w-4 h-4" /> Edit Cards
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" /> Settings
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                >
                  <Zap className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import Auth from "./components/Auth";

function AppContent() {
  const { user, loading, profile } = useUser();
  const { maintenanceMode } = useAdminState();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 md:border-[#1a1a24] relative bg-[#0a0a0c] shadow-2xl">
          <Auth />
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'super_admin' || user?.email === 'lusimadio12@gmail.com' || user?.email === 'simao@neurogrowthlabs.co.za';
  const isSuspended = profile?.status === "Suspended";

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 md:border-[#1a1a24] relative bg-[#0d0101] shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mb-6 text-red-500 animate-pulse animate-duration-1000">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-red-400 mb-2">Account Suspended</h1>
          <p className="text-xs text-white/60 leading-relaxed mb-6">
            This user account has been suspended by the super administrator. Access to the platform's core registry has been restricted.
          </p>
          <div className="text-[10px] font-mono text-white/30">
            SECURITY TRACE ID: SUSP_STATE_ACTIVE
          </div>
        </div>
      </div>
    );
  }

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 md:border-[#1a1a24] relative bg-[#0a0803] shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-950/50 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-500 animate-pulse">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-amber-400 mb-2">Maintenance Underway</h1>
          <p className="text-xs text-white/60 leading-relaxed mb-6">
            The Neuro NetWorks platform is currently undergoing scheduled system calibration. We apologize for the brief interruption.
          </p>
          <div className="text-[10px] font-mono text-white/30">
            SYSTEM ENGINE STATUS: CALIBRATING
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex justify-center">
      {/* Mobile frame container */}
      <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 md:border-[#1a1a24] relative bg-[#0a0a0c] shadow-2xl">
        <TopNav />
        <div className="h-full overflow-y-auto pt-16 pb-6 scrollbar-hide">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/user-dashboard" element={<Dashboard />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ai-networking" element={<AINetworking />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/card-builder" element={<CardBuilder />} />
            <Route path="/card-view" element={<CardView />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/contact-vault" element={<ContactVault />} />
            <Route path="/crm-integration" element={<CRMIntegration />} />
            <Route path="/map" element={<GeoMap />} />
            <Route path="/welcome" element={<Landing />} />
            <Route path="/my-cards" element={<MyCards />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/alerts" element={<ProximityAlerts />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/team" element={<Team />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/voice-call" element={<VoiceCall />} />
            <Route path="/chat" element={<GoogleChat />} />
            <Route path="/meet" element={<GoogleMeet />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AdminStateProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AppContent />
            <Toaster theme="dark" position="top-center" />
          </Router>
        </QueryClientProvider>
      </AdminStateProvider>
    </UserProvider>
  );
}
