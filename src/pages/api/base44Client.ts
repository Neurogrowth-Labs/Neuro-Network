import { supabase } from "@/lib/supabase";

const getSupabaseTableName = (entity: string) => {
  const snake = entity.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  if (snake.endsWith("s")) return snake;
  if (snake.endsWith("y")) return `${snake.slice(0, -1)}ies`;
  return `${snake}s`;
};

const authHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestJson = async (url: string, init: RequestInit = {}) => {
  const headers = {
    ...(await authHeaders()),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
};

const makeEntityClient = (name: string) => ({
  list: async (orderBy?: string) => {
    const params = new URLSearchParams();
    if (orderBy) params.set("orderBy", orderBy);
    const query = params.toString();
    return requestJson(`/api/db/${name}${query ? `?${query}` : ""}`);
  },
  filter: async (filters: Record<string, string>) => {
    const query = new URLSearchParams(filters).toString();
    return requestJson(`/api/db/${name}${query ? `?${query}` : ""}`);
  },
  create: async (data: any) =>
    requestJson(`/api/db/${name}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: async (id: string, data: any) =>
    requestJson(`/api/db/${name}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: async (id: string) =>
    requestJson(`/api/db/${name}/${id}`, { method: "DELETE" }),
  subscribe: (callback?: (event: any) => void) => {
    const table = getSupabaseTableName(name);
    const channel = supabase
      .channel(`${table}-entity-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          callback?.({
            type: payload.eventType.toLowerCase(),
            id: (payload.new as any)?.id || (payload.old as any)?.id,
            data: payload.new,
            old: payload.old,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
});

const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  const user = data.user;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    full_name: meta.full_name || meta.name || user.email || "Authenticated user",
    email: user.email,
    photo_url: meta.avatar_url || meta.picture || "",
    role: meta.role || "user",
    plan_type: meta.plan_type,
  };
};

export const base44 = {
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, response_json_schema }: any) => {
        const res = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, response_json_schema }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "LLM computation failed");
        }

        const data = await res.text();
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      },
    },
  },
  entities: {
    CardComment: makeEntityClient("CardComment"),
    ProximitySession: makeEntityClient("ProximitySession"),
    BusinessCard: makeEntityClient("BusinessCard"),
    Subscription: makeEntityClient("Subscription"),
  },
  auth: {
    me: getCurrentUser,
    logout: async (url?: string) => {
      await supabase.auth.signOut();
      if (url) window.location.assign(url);
    },
    redirectToLogin: (url?: string) => {
      const target = url || window.location.href;
      window.location.assign(`/auth?redirect=${encodeURIComponent(target)}`);
    },
  },
};
