import React, { useState } from "react";
import { CheckCircle2, CreditCard, Lock, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import GooglePayButton from "../components/payments/GooglePayButton";
import { useUser } from "../lib/UserContext";
import { Link } from "react-router-dom";

import { PREMIUM_PLAN } from "../lib/subscription";

const PLAN = PREMIUM_PLAN;

type PaymentMethod = "stripe" | "paypal" | "google-pay";

export default function Checkout() {
  const { user, profile, setProfile } = useUser();
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [cardName, setCardName] = useState(profile.full_name || "");
  const [paypalEmail, setPaypalEmail] = useState(user?.email || profile.email || "");

  const activateSubscription = (nextReceipt: any) => {
    const activeUntil = new Date();
    activeUntil.setMonth(activeUntil.getMonth() + 1);
    const subscription = {
      subscription_status: "active",
      subscription_plan: PLAN.name,
      subscription_amount_cents: PLAN.priceCents,
      subscription_interval: PLAN.interval,
      subscription_provider: nextReceipt.provider,
      subscription_receipt_id: nextReceipt.id,
      provider_subscription_id: nextReceipt.providerSubscriptionId || nextReceipt.id,
      subscription_transaction_id: nextReceipt.transactionId || nextReceipt.id,
      subscription_started_at: nextReceipt.startedAt,
      next_billing_date: nextReceipt.nextBillingDate || activeUntil.toISOString(),
      subscription_active_until: nextReceipt.nextBillingDate || activeUntil.toISOString(),
    };

    localStorage.setItem(`subscription_${user?.id || "guest"}`, JSON.stringify(subscription));
    setProfile((prev: any) => ({ ...prev, ...subscription }));
    setReceipt({ ...nextReceipt, activeUntil: activeUntil.toISOString() });
    toast.success("Subscription active. Welcome to Neuro NetWorks!");
  };

  const submitPayment = async (provider: "stripe" | "paypal") => {
    setLoading(true);
    try {
      if (provider === "stripe" && !cardName) {
        throw new Error("Enter the billing name to continue. Card details are collected by Stripe Checkout in production.");
      }
      if (provider === "paypal" && !paypalEmail.includes("@")) {
        throw new Error("Enter a valid PayPal email address.");
      }

      const res = await fetch(`/api/payments/${provider}-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email || profile.email,
          payerEmail: provider === "paypal" ? paypalEmail : user?.email || profile.email,
          planName: PLAN.name,
          amountCents: PLAN.priceCents,
          currency: PLAN.currency,
          interval: PLAN.interval,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Subscription payment failed.");
      }

      activateSubscription(await res.json());
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <div className="p-6 space-y-6 min-h-full bg-[#0a0a0c]">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-300" />
          <h1 className="text-2xl font-black tracking-tight text-white">Access unlocked</h1>
          <p className="mt-2 text-sm text-white/60">Your R250 monthly subscription is active.</p>
          <div className="mt-5 rounded-2xl bg-black/30 p-4 text-left text-xs text-white/70 space-y-2">
            <p><strong className="text-white">Plan:</strong> {PLAN.name}</p>
            <p><strong className="text-white">Payment:</strong> {receipt.provider}</p>
            <p><strong className="text-white">Receipt:</strong> {receipt.id}</p>
          </div>
          <Link to="/" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-cyan-300">
            Enter platform
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-full bg-[#0a0a0c]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Subscription required</p>
        <h1 className="mt-2 text-3xl font-light tracking-tighter text-white">Unlock Neuro NetWorks</h1>
        <p className="mt-2 text-sm text-white/60">Your 15-day free trial has expired. Subscribe for R250/month to continue enjoying full access to all features.</p>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white">Platform Access</h2>
            <p className="mt-1 text-xs text-white/55">Full networking, vault, AI Studio, QR, analytics, and team features.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white">R250</div>
            <div className="text-[10px] uppercase tracking-widest text-white/45">monthly</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["stripe", CreditCard, "Stripe"],
          ["paypal", Wallet, "PayPal"],
          ["google-pay", Wallet, "G Pay"],
        ].map(([key, Icon, label]: any) => (
          <button
            key={key}
            onClick={() => setMethod(key)}
            className={`rounded-2xl border p-3 text-xs font-bold transition ${method === key ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/10 bg-white/5 text-white/70 hover:text-white"}`}
          >
            <Icon className="mx-auto mb-2 h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        {method === "stripe" && (
          <div className="space-y-3">
            <h3 className="font-bold text-white">Stripe card subscription</h3>
<input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Billing name" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" />
            <p className="text-[11px] leading-relaxed text-white/45">Card numbers are never stored by Neuro NetWorks. In production this button creates a Stripe Billing Checkout Session using tokenized payment details.</p>
            <button disabled={loading} onClick={() => submitPayment("stripe")} className="w-full rounded-xl bg-cyan-400 py-3 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50">
              {loading ? "Processing…" : "Subscribe with Stripe"}
            </button>
          </div>
        )}

        {method === "paypal" && (
          <div className="space-y-3">
            <h3 className="font-bold text-white">PayPal billing agreement</h3>
            <input value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="PayPal email" type="email" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" />
            <button disabled={loading} onClick={() => submitPayment("paypal")} className="w-full rounded-xl bg-[#ffc439] py-3 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50">
              {loading ? "Processing…" : "Subscribe with PayPal"}
            </button>
          </div>
        )}

        {method === "google-pay" && (
          <div className="space-y-3">
            <h3 className="font-bold text-white">Google Pay through Stripe</h3>
            <GooglePayButton plan={PLAN} userEmail={user?.email || profile.email} onSuccess={activateSubscription} onError={(err) => toast.error(err.message || "Google Pay failed")} />
          </div>
        )}

        <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] leading-relaxed text-white/50">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p><strong className="text-white">Secure recurring access:</strong> server-side status is verified before premium access. Replace the demo endpoints with live Stripe Billing, PayPal Subscriptions, and Google Pay processor credentials before production.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/35">
          <Lock className="h-3 w-3" /> TEST MODE · ZAR · Monthly auto-renewing
        </div>
      </div>
    </div>
  );
}
