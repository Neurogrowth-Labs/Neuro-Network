import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
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

  Radar
} from "lucide-react";
import { UserProvider, useUser } from "./lib/UserContext";
import { AdminStateProvider, useAdminState } from "./lib/AdminStateProvider";
import { WorkspaceProvider } from "./lib/WorkspaceContext";

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

  const tabs = [
    { path: "/", icon: QrCode, label: "Dashboard" },
    { path: "/vault", icon: Contact, label: "Contacts" },
    { path: "/editor", icon: Zap, label: "Studio" },
    { path: "/connect", icon: Radar, label: "Connect" },
  ];


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
