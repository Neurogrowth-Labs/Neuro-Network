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
  Settings as SettingsIcon,
  Radar
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { UserProvider, useUser } from "./lib/UserContext";
import { AdminStateProvider, useAdminState } from "./lib/AdminStateProvider";
import { WorkspaceProvider } from "./lib/WorkspaceContext";
import { supabase } from "./lib/supabase";
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

function BottomNav() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string | number; type: string; text: string; time: string }>>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useUser();
  const tabs = [
    { path: "/", icon: QrCode, label: "Dashboard" },
    { path: "/vault", icon: Contact, label: "Contacts" },
    { path: "/editor", icon: Zap, label: "Studio" },
    { path: "/connect", icon: Radar, label: "Connect" },
  ];

  useEffect(() => {
    const appendNotification = (notification: { id?: string | number; type?: string; content?: string; subject?: string; body?: string }) => {
      const message = notification.content || [notification.subject, notification.body].filter(Boolean).join(": ");
      if (!message) return;
      setNotifications((current) => [
        { id: notification.id || Date.now(), type: notification.type || "system", text: message, time: "Just now" },
        ...current,
      ]);
    };
    const handleRealtimeNotification = (event: Event) => appendNotification((event as CustomEvent).detail || {});
    const handleBroadcast = (event: Event) => appendNotification((event as CustomEvent).detail || {});
    const openNotifications = () => setShowNotifications(true);

    window.addEventListener("realtime-notification-received", handleRealtimeNotification);
    window.addEventListener("admin-global-broadcast", handleBroadcast);
    window.addEventListener("open-notifications", openNotifications);

    if (!profile?.id) return () => {
      window.removeEventListener("realtime-notification-received", handleRealtimeNotification);
      window.removeEventListener("admin-global-broadcast", handleBroadcast);
      window.removeEventListener("open-notifications", openNotifications);
    };

    supabase.from("notifications").select("id,type,content,created_at").eq("user_id", profile.id)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setNotifications((data || []).map((notification: any) => ({
        id: notification.id,
        type: notification.type || "system",
        text: notification.content,
        time: notification.created_at ? new Date(notification.created_at).toLocaleString() : "Just now",
      }))));

    const channel = supabase.channel("bottom-nav-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        (payload) => appendNotification(payload.new as { id?: string | number; type?: string; content?: string }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("realtime-notification-received", handleRealtimeNotification);
      window.removeEventListener("admin-global-broadcast", handleBroadcast);
      window.removeEventListener("open-notifications", openNotifications);
    };
  }, [profile?.id]);

  return (
    <nav className="relative shrink-0 border-t border-[#dbe3ec] bg-white px-2 py-2" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-4xl items-center justify-around gap-1">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return <Link key={tab.path} to={tab.path} replace={active} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${active ? "bg-[#eaf3fb] text-[#0a66c2]" : "text-[#475569] hover:bg-[#f6f9fc] hover:text-[#0a66c2]"}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </Link>;
        })}
        <div className="relative flex min-w-0 flex-1 justify-center">
          <button onClick={() => setShowNotifications((open) => !open)} className="flex w-full flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold text-[#475569] transition-colors hover:bg-[#f6f9fc] hover:text-[#0a66c2]" aria-expanded={showNotifications} aria-label="Notifications">
            <span className="relative"><Bell className="h-4 w-4" />{notifications.length > 0 && <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-[#0a66c2] ring-2 ring-white" />}</span>Notifications
          </button>
          {showNotifications && <div className="absolute bottom-12 right-0 z-50 w-72 overflow-hidden rounded-lg border border-[#dbe3ec] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#e7edf3] px-3 py-2"><span className="text-xs font-semibold text-[#111827]">Notifications</span><button className="text-[10px] font-medium text-[#0a66c2]" onClick={() => setNotifications([])}>Clear</button></div>
            <div className="max-h-64 overflow-y-auto">{notifications.length === 0 ? <p className="p-4 text-center text-xs text-[#64748b]">No new notifications</p> : notifications.map((notification) => <button key={notification.id} className="flex w-full gap-2 border-b border-[#eef2f6] p-3 text-left hover:bg-[#f6f9fc]" onClick={() => { if (notification.type === "connection_request" || notification.text.includes("connection request")) navigate("/connect"); setShowNotifications(false); }}><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#0a66c2]" /><span><span className="block text-xs text-[#1f2937]">{notification.text}</span><span className="mt-1 block text-[10px] text-[#64748b]">{notification.time}</span></span></button>)}</div>
          </div>}
        </div>
        <Link to="/settings" className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${location.pathname === "/settings" ? "bg-[#eaf3fb] text-[#0a66c2]" : "text-[#475569] hover:bg-[#f6f9fc] hover:text-[#0a66c2]"}`}><SettingsIcon className="h-4 w-4" />Settings</Link>
      </div>
    </nav>
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
      <div className="min-h-screen bg-[#f3f2ef] flex justify-center">
        <div className="w-full min-h-screen relative">
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
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-white">
        <main className="min-h-0 flex-1 overflow-y-auto">
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
        </main>
        <BottomNav />
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
