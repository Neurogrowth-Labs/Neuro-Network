import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
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
  Radar
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { UserProvider, useUser } from "./lib/UserContext";
import { AdminStateProvider, useAdminState } from "./lib/AdminStateProvider";
import { WorkspaceProvider } from "./lib/WorkspaceContext";
import { supabase } from "./lib/supabase";
import WorkspaceSelector from "./components/workspace/WorkspaceSelector";
import { hasPremiumAccess } from "./lib/subscription";

// Pages
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Editor from "./pages/Editor";
import Admin from "./pages/Admin";
import AINetworking from "./pages/AINetworking";
import Connect from "./pages/Connect";
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
import PageNotFound from "./components/PageNotFound";

const queryClient = new QueryClient();

function TopNav() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string | number; type: string; text: string; time: string }>>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout, isOnline } = useUser();
  const isAdmin = profile?.role === 'super_admin' || profile?.email === 'lusimadio12@gmail.com' || profile?.email === 'simao@neurogrowthlabs.co.za';
  const tabs = [
    { path: "/", icon: QrCode, label: "Dashboard" },
    { path: "/vault", icon: Contact, label: "Vault" },
    { path: "/editor", icon: Zap, label: "Studio" },
    { path: "/connect", icon: Radar, label: "Connect" },
  ];

  useEffect(() => {
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

    if (profile?.id) {
      supabase
        .from("notifications")
        .select("id,type,content,created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setNotifications((data || []).map((n: any) => ({
            id: n.id,
            type: n.type || "system",
            text: n.content,
            time: n.created_at ? new Date(n.created_at).toLocaleString() : "Just now",
          })));
        });

      const channel = supabase
        .channel("top-nav-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
          (payload) => {
            const next: any = payload.new;
            setNotifications(prev => [
              { id: next.id, type: next.type || "system", text: next.content, time: "Just now" },
              ...prev,
            ]);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener("realtime-notification-received", handleRealtimeNotif);
        window.removeEventListener("admin-global-broadcast", handleGlobalBroadcast);
      };
    }

    return () => {
      window.removeEventListener("realtime-notification-received", handleRealtimeNotif);
      window.removeEventListener("admin-global-broadcast", handleGlobalBroadcast);
    };
  }, [profile?.id]);

  return (
    <div className="fixed top-0 w-full md:w-[400px] h-16 border-b border-white/5 bg-transparent z-50 flex items-center justify-between px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            setShowMobileMenu(!showMobileMenu);
            setShowNotifications(false);
          }}
          className="text-white/50 hover:text-white transition-colors p-1"
        >
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" onError={(e) => e.currentTarget.src = '/logo.png'} className="w-8 h-8 rounded-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] object-cover bg-white p-0.5" />
          {!isOnline && (
            <span className="text-[8px] text-amber-400 font-mono tracking-widest uppercase animate-pulse font-bold">
              Offline (IDB Cache)
            </span>
          )}
        </div>
        <div className="hidden sm:block">
          <WorkspaceSelector />
        </div>
      </div>

      {showMobileMenu && (
        <div className="absolute left-4 top-16 w-48 glass-menu rounded-xl overflow-hidden z-50">
          <div className="p-2 flex flex-col gap-1">
            {tabs.map((t) => {
              const active = location.pathname === t.path;
              return (
                <Link
                  key={t.path}
                  to={t.path}
                  replace={active}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${active ? "bg-cyan-500/10 text-cyan-400 font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <t.icon className={`w-4 h-4 ${active ? "drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" : ""}`} />
                  {t.label}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-white/5 p-2 flex flex-col gap-1">
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors font-semibold"
              >
                <Shield className="w-4 h-4" /> Admin Console
              </Link>
            )}
            <Link
              to="/settings"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <UserIcon className="w-4 h-4" /> Edit Profile
            </Link>
            <Link
              to="/my-cards"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Contact className="w-4 h-4" /> Edit Cards
            </Link>
            <Link
              to="/settings"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={async () => {
                await logout();
                setShowMobileMenu(false);
              }}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left"
            >
              <Zap className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 relative">
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
            }} 
            className="relative text-white/50 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0c]"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-12 w-64 glass-menu rounded-xl overflow-hidden z-50">
              <div className="p-3 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Notifications</span>
                <span className="text-[10px] text-cyan-400 cursor-pointer" onClick={() => setNotifications([])}>Mark all read</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/40">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3"
                      onClick={() => {
                        if (n.type === "connection_request" || n.text.includes("connection request")) {
                          navigate("/connect");
                          setShowNotifications(false);
                        }
                      }}
                    >
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
      <div className="min-h-screen app-aurora text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative glass-panel premium-device-frame">
          <Auth />
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'super_admin' || user?.email === 'lusimadio12@gmail.com' || user?.email === 'simao@neurogrowthlabs.co.za';
  const isSuspended = (profile?.status as string | undefined) === "Suspended";

  if (isSuspended) {
    return (
      <div className="min-h-screen app-aurora text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative bg-red-950/30 glass-panel premium-device-frame flex flex-col items-center justify-center p-6 text-center">
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


  const hasAccess = hasPremiumAccess(profile);

  if (!isAdmin && !hasAccess) {
    return (
      <div className="min-h-screen app-aurora text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative glass-panel premium-device-frame">
          <div className="h-full overflow-y-auto scrollbar-hide">
            <Checkout />
          </div>
        </div>
      </div>
    );
  }

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen app-aurora text-white flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative bg-amber-950/25 glass-panel premium-device-frame flex flex-col items-center justify-center p-6 text-center">
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
    <div className="min-h-screen app-aurora text-white flex justify-center">
      {/* Mobile frame container */}
      <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative glass-panel premium-device-frame">
        <TopNav />
        <div className="h-full overflow-y-auto pt-16 pb-6 scrollbar-hide">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/user-dashboard" element={<Navigate to="/" replace />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ai-networking" element={<AINetworking />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/card-builder" element={<CardBuilder />} />
            <Route path="/card-view" element={<CardView />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/subscribe" element={<Navigate to="/checkout" replace />} />
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
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <WorkspaceProvider>
        <AdminStateProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <AppContent />
              <Toaster theme="dark" position="top-center" />
            </Router>
          </QueryClientProvider>
        </AdminStateProvider>
      </WorkspaceProvider>
    </UserProvider>
  );
}
