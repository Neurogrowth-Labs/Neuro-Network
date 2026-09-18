import React, { useState, useEffect } from "react";
import CardPreview from "../components/CardPreview";
import CardPDFDownload from "../components/CardPDFDownload";
import UsageBar from "../components/UsageBar";
import PlanBadge from "../components/PlanBadge";
import ProximityWidget from "../components/ProximityWidget";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import { Link, useNavigate } from "react-router-dom";
import { QrCode, Share2, ScanLine, ArrowUpRight, Copy, X, Mail, MessageCircle, MessageSquare, Bell, Settings } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "../lib/UserContext";
import { supabase } from "../lib/supabase";
import { normalizeSubscription, trialDaysRemaining, PREMIUM_PLAN } from "../lib/subscription";

interface NotificationItem {
  id: string | number;
  type: string;
  content: string;
  createdAt: string;
}

interface DashboardStats {
  profileViews: number;
  saves: number;
  conversionRate: number;
  businessCardsCount: number;
  businessCardsLimit: number;
  contactsCount: number;
  contactsLimit: number;
}

export const MY_CARD = {
  full_name: "",
  job_title: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  bio: "",
  template: "executive",
  theme_color: "#06b6d4",
  linkedin: "",
  twitter: "",
};

export default function Dashboard() {
  const { profile, user } = useUser();
  const cardData = profile || MY_CARD;
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    saves: 0,
    conversionRate: 0,
    businessCardsCount: 0,
    businessCardsLimit: 3,
    contactsCount: 0,
    contactsLimit: 1000,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();
  const subscriptionState = normalizeSubscription(profile);
  const trialDays = trialDaysRemaining(profile);

  const cardUrl = `${window.location.origin}/card-view`;

  useEffect(() => {
    if (!user?.id) {
      setIsLoadingStats(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { count: contactsCount } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: cardsCount } = await supabase
          .from("business_cards")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: viewsCount } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id)
          .gte("viewed_at", thirtyDaysAgo.toISOString());

        const { count: savesCount } = await supabase
          .from("card_saves")
          .select("*", { count: "exact", head: true })
          .eq("card_owner_id", user.id)
          .gte("saved_at", thirtyDaysAgo.toISOString());

        const views = viewsCount || 0;
        const saves = savesCount || 0;
        const conversion = views > 0 ? Math.round((saves / views) * 100) : 0;

        setStats({
          profileViews: views,
          saves: saves,
          conversionRate: conversion,
          businessCardsCount: cardsCount || 0,
          businessCardsLimit: profile?.role === 'super_admin' ? 100 : 3,
          contactsCount: contactsCount || 0,
          contactsLimit: profile?.role === 'super_admin' ? 10000 : 1000,
        });
      } catch (error) {
        console.warn("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();

    const channel = supabase
      .channel("dashboard-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts", filter: `user_id=eq.${user.id}` },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role]);

  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,content,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data || []).map((notification: any) => ({
        id: notification.id,
        type: notification.type || "system",
        content: notification.content,
        createdAt: notification.created_at,
      })));
    };

    void loadNotifications();
    const channel = supabase
      .channel("dashboard-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notification: any = payload.new;
          setNotifications((current) => [{
            id: notification.id,
            type: notification.type || "system",
            content: notification.content,
            createdAt: notification.created_at,
          }, ...current]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    toast.success("Profile link copied!");
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=Check out my digital business card: ${cardUrl}`, '_blank');
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=My Digital Business Card&body=Here is my digital business card: ${cardUrl}`;
  };

  const shareViaSMS = () => {
    window.location.href = `sms:?&body=Check out my digital business card: ${cardUrl}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 text-[#111827] dark:text-slate-100">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[#111827] dark:text-slate-100">My Profile</h1>
          <div className="flex items-center gap-2">
            <PlanBadge plan="pro" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#64748b] dark:text-slate-400">Active Card</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <CardPreview card={cardData} />
      </div>

      {/* Subscription Card */}
      <div className="rounded-lg border border-[#dbe3ec] bg-white p-4 flex items-center justify-between gap-3 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0a66c2] dark:text-blue-400">
            Subscription
          </p>
          <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100">
            {subscriptionState.status === "trial"
              ? `${trialDays} trial day${trialDays === 1 ? "" : "s"} remaining`
              : subscriptionState.status}
          </h2>
          <p className="text-[11px] text-[#475569] dark:text-slate-400">
            {PREMIUM_PLAN.name} · {PREMIUM_PLAN.displayPrice}/month · Full premium access during the 7-day trial countdown.
          </p>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          className="rounded-md bg-[#0a66c2] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#084e96] dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Manage
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Copy Link", icon: Copy, action: copyLink },
          { label: "Show QR", icon: QrCode, action: () => setShowQRModal(true) },
          { label: "Share App", icon: Share2, action: () => setShowShareModal(true) },
          { label: "Proximity Share", icon: ScanLine, action: () => navigate("/alerts") }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="group flex flex-col items-center justify-center py-6 bg-white border border-[#dbe3ec] hover:bg-[#f0f7fd] hover:border-[#9dc5e8] rounded-xl transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/60 dark:hover:border-slate-700"
          >
            <item.icon className="w-5 h-5 text-[#0a66c2] mb-2 group-hover:scale-110 transition-transform dark:text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#475569] group-hover:text-[#111827] transition-colors dark:text-slate-400 dark:group-hover:text-slate-200">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <ProximityWidget />

      {/* Stats Card */}
      <div className="bg-white rounded-lg p-6 border border-[#dbe3ec] space-y-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-[10px] font-black text-[#64748b] dark:text-slate-400 uppercase tracking-widest flex justify-between">
          30 Days Performance
          <ArrowUpRight className="w-4 h-4 text-[#0a66c2] dark:text-blue-400" />
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <div className="border-r border-[#e7edf3] dark:border-slate-800 pr-2">
            <p className="text-3xl font-light tracking-tighter text-[#0a66c2] dark:text-blue-400">
              {isLoadingStats ? "..." : stats.profileViews.toLocaleString()}
            </p>
            <p className="text-[9px] font-black text-[#111827]/30 dark:text-slate-500 uppercase tracking-widest mt-1">
              Profile Views
            </p>
          </div>
          <div className="border-r border-[#e7edf3] dark:border-slate-800 px-2">
            <p className="text-3xl font-light tracking-tighter text-[#111827] dark:text-slate-100">
              {isLoadingStats ? "..." : stats.saves.toLocaleString()}
            </p>
            <p className="text-[9px] font-black text-[#111827]/30 dark:text-slate-500 uppercase tracking-widest mt-1">
              Saves
            </p>
          </div>
          <div className="pl-2">
            <p className="text-3xl font-light tracking-tighter text-[#0a66c2] dark:text-blue-400">
              {isLoadingStats ? "..." : `${stats.conversionRate > 0 ? '+' : ''}${stats.conversionRate}%`}
            </p>
            <p className="text-[9px] font-black text-[#111827]/30 dark:text-slate-500 uppercase tracking-widest mt-1">
              Conversion
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#e7edf3] dark:border-slate-800 space-y-4">
          <UsageBar
            label="Business Cards"
            used={stats.businessCardsCount}
            limit={stats.businessCardsLimit}
            color="bg-cyan-400"
          />
          <UsageBar
            label="Contacts"
            used={stats.contactsCount}
            limit={stats.contactsLimit}
            color="bg-[#64748b]"
          />
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-[#dbe3ec] dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium tracking-tight text-[#111827] dark:text-slate-100">
                Share via QR Code
              </h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-[#64748b] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center p-4">
              <QRCodeDisplay value={cardUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-[#dbe3ec] dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium tracking-tight text-[#111827] dark:text-slate-100">
                Share App
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-[#64748b] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={shareViaWhatsApp}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111827] dark:text-slate-100">WhatsApp</div>
                  <div className="text-xs text-[#64748b] dark:text-slate-400">Send to a contact directly</div>
                </div>
              </button>
              
              <button 
                onClick={shareViaEmail}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#e7edf3] bg-white hover:bg-[#f6f9fc] dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#0a66c2] dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111827] dark:text-slate-100">Email</div>
                  <div className="text-xs text-[#64748b] dark:text-slate-400">Share via email client</div>
                </div>
              </button>

              <button 
                onClick={shareViaSMS}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#e7edf3] bg-white hover:bg-[#f6f9fc] dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111827] dark:text-slate-100">SMS</div>
                  <div className="text-xs text-[#64748b] dark:text-slate-400">Send a text message</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
