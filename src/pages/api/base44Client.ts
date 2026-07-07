import { auth } from "@/lib/googleAuth";

const makeEntityClient = (name: string) => ({
  list: async (orderBy?: string) => {
    const res = await fetch(`/api/db/${name}${orderBy ? `?orderBy=${encodeURIComponent(orderBy)}` : ""}`);
    if (!res.ok) throw new Error(`Failed to load ${name}`);
    return res.json();
  },
  filter: async (filters: Record<string, string>) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/db/${name}?${query}`);
    if (!res.ok) throw new Error(`Failed to filter ${name}`);
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetch(`/api/db/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create ${name}`);
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/db/${name}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update ${name}`);
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/db/${name}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to delete ${name}`);
    return res.json();
  },
  subscribe: (_callback?: unknown) => () => {},
});

const getCurrentUser = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  return {
    id: currentUser.uid,
    full_name: currentUser.displayName || currentUser.email || "Authenticated user",
    email: currentUser.email,
    photo_url: currentUser.photoURL,
    role: "user",
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
      await auth.signOut();
      if (url) window.location.assign(url);
    },
    redirectToLogin: (url?: string) => {
      const target = url || window.location.href;
      window.location.assign(`/auth?redirect=${encodeURIComponent(target)}`);
    },
  },
};
