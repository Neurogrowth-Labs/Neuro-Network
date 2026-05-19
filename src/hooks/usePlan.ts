import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { canAccess, getLimit, withinLimit, PLANS } from "../lib/planAccess";

export function usePlan() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Subscription?.filter?.({})
        .then((res: any) => res?.[0] || null)
        .catch(() => null),
    ]).then(([u, subs]) => {
      setUser(u);
      setSubscription(subs);
      setLoading(false);
    });
  }, []);

  const plan = subscription?.plan || user?.plan_type || "free";
  const planInfo = PLANS[plan] || PLANS.free;

  return {
    plan,
    planInfo,
    loading,
    user,
    subscription,
    isTrialing: subscription?.status === "trialing",
    isPro: plan === "pro" || plan === "business",
    isBusiness: plan === "business",
    canAccess: (feature: string) => canAccess(plan, feature),
    getLimit: (feature: string) => getLimit(plan, feature),
    withinLimit: (feature: string, count: number) =>
      withinLimit(plan, feature, count),
  };
}
