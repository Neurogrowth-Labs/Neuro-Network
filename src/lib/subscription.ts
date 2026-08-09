export const PREMIUM_PLAN = {
  id: "premium_monthly",
  name: "Premium Monthly",
  priceCents: 25000,
  currency: "ZAR",
  displayPrice: "R250.00",
  interval: "monthly",
  billingCycleDays: 30,
  trialDays: 15,
};

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "past_due" | "inactive";

export interface BillingRecord {
  id?: string;
  provider: "stripe" | "paypal" | "google-pay" | string;
  transaction_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string;
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  plan_name?: string;
  payment_provider?: string;
  provider_subscription_id?: string;
  transaction_id?: string;
  trial_started_at?: string;
  trial_expires_at?: string;
  subscription_started_at?: string;
  next_billing_date?: string;
  grace_period_ends_at?: string;
  cancelled_at?: string;
  billing_history?: BillingRecord[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createTrialWindow(now = new Date()) {
  const expires = new Date(now.getTime() + PREMIUM_PLAN.trialDays * MS_PER_DAY);
  return {
    trial_started_at: now.toISOString(),
    trial_expires_at: expires.toISOString(),
  };
}

export function daysUntil(date?: string, now = new Date()) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((new Date(date).getTime() - now.getTime()) / MS_PER_DAY));
}

export function normalizeSubscription(profile: any, now = new Date()): SubscriptionState {
  const trialStarted = profile?.trial_started_at;
  const trialExpires = profile?.trial_expires_at;
  const activeUntil = profile?.subscription_active_until || profile?.next_billing_date;
  const status = profile?.subscription_status as SubscriptionStatus | undefined;

  if (status === "active" && activeUntil && new Date(activeUntil).getTime() > now.getTime()) {
    return { ...profile, status: "active", next_billing_date: activeUntil };
  }

  if (status === "cancelled") return { ...profile, status: "cancelled" };
  if (status === "past_due" && profile?.grace_period_ends_at && new Date(profile.grace_period_ends_at).getTime() > now.getTime()) {
    return { ...profile, status: "past_due" };
  }

  if (trialStarted && trialExpires && new Date(trialExpires).getTime() > now.getTime()) {
    return { ...profile, status: "trial", trial_started_at: trialStarted, trial_expires_at: trialExpires };
  }

  return { ...profile, status: trialExpires ? "expired" : "inactive" };
}

export function hasPremiumAccess(profile: any, now = new Date()) {
  const state = normalizeSubscription(profile, now);
  return state.status === "trial" || state.status === "active" || state.status === "past_due";
}

export function trialDaysRemaining(profile: any, now = new Date()) {
  return daysUntil(profile?.trial_expires_at, now);
}
