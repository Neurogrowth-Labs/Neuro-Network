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
  Radar,
  Bell,
  Settings as SettingsIcon
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
import Auth from "./components/Auth";
import NeuralLogo from "./components/NeuralLogo";

const queryClient = new QueryClient();

function BottomNav() {
  const location = useLocation();

  const tabs = [
    { path: "/", icon: QrCode, label: "Dashboard" },
    { path: "/vault", icon: Contact, label: "Contacts" },
    { path: "/editor", icon: Zap, label: "Studio" },
    { path: "/connect", icon: Radar, label: "Connect" },
  ];

  return (
    <nav className="sticky bottom-0 z-50 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 text-xs font-medium ${
                isActive ? "text-[#4169e1]" : "text-black hover:text-black"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** A consistent top-right utility area keeps global actions discoverable on every page. */
function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#d9d9d9] bg-white px-6">
      <Link to="/" aria-label="Neuro Networks home" className="flex h-12 w-12 items-center justify-center">
        <NeuralLogo className="h-11 w-11" />
      </Link>
      <nav aria-label="Application utilities" className="flex items-center gap-2">
        <Link
          to="/alerts"
          aria-label="Notifications"
          title="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#4169e1] bg-[#4169e1] text-black hover:bg-[#4169e1]"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          to="/settings"
          aria-label="Settings"
          title="Settings"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#4169e1] bg-[#4169e1] text-black hover:bg-[#4169e1]"
        >
          <SettingsIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}

function AppContent() {
  const { user, loading, profile } = useUser();
  const { maintenanceMode } = useAdminState();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <NeuralLogo className="h-28 w-28" />
          <div className="w-8 h-8 border-4 border-[#4169e1] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-md p-4">
          <Auth />
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'super_admin' || user?.email === 'lusimadio12@gmail.com' || user?.email === 'simao@neurogrowthlabs.co.za';
  const isSuspended = (profile?.status as string | undefined) === "Suspended";

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white border border-[#4169e1] flex items-center justify-center mb-6 text-black animate-pulse animate-duration-1000">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-black mb-2">Account Suspended</h1>
          <p className="text-xs text-black leading-relaxed mb-6">
            This user account has been suspended by the super administrator. Access to the platform's core registry has been restricted.
          </p>
          <div className="text-[10px] font-mono text-black">
            SECURITY TRACE ID: SUSP_STATE_ACTIVE
          </div>
        </div>
      </div>
    );
  }

  const hasAccess = hasPremiumAccess(profile);

  if (!isAdmin && !hasAccess) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative bg-white">
          <div className="h-full overflow-y-auto scrollbar-hide">
            <Checkout />
          </div>
        </div>
      </div>
    );
  }

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center">
        <div className="w-full h-full md:w-[400px] md:h-[800px] md:mt-10 md:rounded-[40px] md:overflow-hidden md:border-8 relative bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white border border-[#4169e1] flex items-center justify-center mb-6 text-black animate-pulse">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-black mb-2">Maintenance Underway</h1>
          <p className="text-xs text-black leading-relaxed mb-6">
            The Neuro NetWorks platform is currently undergoing scheduled system calibration. We apologize for the brief interruption.
          </p>
          <div className="text-[10px] font-mono text-black">
            SYSTEM ENGINE STATUS: CALIBRATING
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-white">
        <AppHeader />
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
              <Toaster theme="light" position="top-center" />
            </Router>
          </QueryClientProvider>
        </AdminStateProvider>
      </WorkspaceProvider>
    </UserProvider>
  );
}
