export const PLANS: any = {
  free: {
    name: "Free",
    price: 0,
    color: "text-white/40",
    badge: "bg-white/10 text-white/50",
    limits: {
      cards: 1,
      contacts: 100,
      scans: 5,
      team_members: 0,
      analytics_days: 7,
    },
    features: {
      basic_templates: true,
      premium_templates: false,
      qr_sharing: true,
      custom_qr: false,
      ai_scanner: false,
      full_analytics: false,
      team_management: false,
      company_branding: false,
      bulk_cards: false,
      export_leads: false,
      custom_domain: false,
      priority_support: false,
    },
  },
  pro: {
    name: "Pro",
    price: 9,
    color: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400",
    limits: {
      cards: -1,
      contacts: -1,
      scans: -1,
      team_members: 0,
      analytics_days: 90,
    },
    features: {
      basic_templates: true,
      premium_templates: true,
      qr_sharing: true,
      custom_qr: true,
      ai_scanner: true,
      full_analytics: true,
      team_management: false,
      company_branding: false,
      bulk_cards: false,
      export_leads: false,
      custom_domain: false,
      priority_support: false,
    },
  },
  business: {
    name: "Business",
    price: 29,
    color: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400",
    limits: {
      cards: -1,
      contacts: -1,
      scans: -1,
      team_members: -1,
      analytics_days: 365,
    },
    features: {
      basic_templates: true,
      premium_templates: true,
      qr_sharing: true,
      custom_qr: true,
      ai_scanner: true,
      full_analytics: true,
      team_management: true,
      company_branding: true,
      bulk_cards: true,
      export_leads: true,
      custom_domain: true,
      priority_support: true,
    },
  },
};

export const ROLES: any = {
  super_admin: { label: "Super Admin", permissions: ["all"] },
  admin: {
    label: "Admin",
    permissions: [
      "manage_team",
      "manage_branding",
      "create_card",
      "edit_card",
      "delete_card",
      "view_analytics",
      "export_leads",
      "manage_subscription",
    ],
  },
  manager: {
    label: "Manager",
    permissions: ["create_card", "edit_card", "view_analytics", "manage_team"],
  },
  member: { label: "Member", permissions: ["create_card", "edit_card"] },
  user: { label: "User", permissions: ["create_card"] },
};

export function canAccess(plan: string, feature: string) {
  return (PLANS[plan] || PLANS.free).features[feature] === true;
}

export function getLimit(plan: string, feature: string) {
  return (PLANS[plan] || PLANS.free).limits[feature] ?? -1;
}

export function withinLimit(
  plan: string,
  feature: string,
  currentUsage: number,
) {
  const limit = getLimit(plan, feature);
  return limit === -1 || currentUsage < limit;
}

export function hasPermission(role: string, permission: string) {
  const r = ROLES[role] || ROLES.user;
  return r.permissions.includes("all") || r.permissions.includes(permission);
}
