import React from "react";
import { ArrowUpRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";

import { PREMIUM_PLAN } from "../lib/subscription";

const PLAN = PREMIUM_PLAN;
const WHOP_CHECKOUT_URL = "https://whop.com/checkout/plan_43cIN67cFSmVh";

export default function Checkout() {
  return (
    <div className="p-6 space-y-6 min-h-full bg-[#0a0a0c]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Subscription required</p>
        <h1 className="mt-2 text-3xl font-light tracking-tighter text-white">Unlock Neuro NetWorks</h1>
        <p className="mt-2 text-sm text-white/60">Your 7-day free trial has expired. Subscribe for R250/month to continue enjoying full access to all features.</p>
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

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="space-y-3">
          <h3 className="font-bold text-white">Complete checkout with Whop</h3>
          <p className="text-[11px] leading-relaxed text-white/45">
            You'll be redirected to Whop to securely complete your {PLAN.displayPrice}/month subscription.
          </p>
          <a
            href={WHOP_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-xs font-black uppercase tracking-widest text-black transition hover:bg-cyan-300"
          >
            Subscribe with Whop
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-2 text-[11px] text-white/55">
          {[
            "Secure hosted checkout through Whop",
            "Monthly recurring access for the Neuro NetWorks platform",
            "Return to the app after checkout to continue using your account",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] leading-relaxed text-white/50">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p><strong className="text-white">Secure recurring access:</strong> payments are processed by Whop. Subscription access should be verified server-side before granting premium access in production.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/35">
          <Lock className="h-3 w-3" /> WHOP CHECKOUT · ZAR · Monthly auto-renewing
        </div>
      </div>
    </div>
  );
}
