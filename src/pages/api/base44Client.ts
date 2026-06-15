const makeEntityMock = (name: string) => ({
  list: async (orderBy?: string) => {
    const res = await fetch(`/api/db/${name}${orderBy ? `?orderBy=${encodeURIComponent(orderBy)}` : ""}`);
    return res.ok ? res.json() : [];
  },
  filter: async (filters: any) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/db/${name}?${query}`);
    return res.ok ? res.json() : [];
  },
  create: async (data: any) => {
    const res = await fetch(`/api/db/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok ? res.json() : data;
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`/api/db/${name}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok ? res.json() : data;
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/db/${name}/${id}`, { method: "DELETE" });
    return res.ok ? res.json() : {};
  },
  subscribe: (callback: any) => {
    return () => {};
  },
});

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
    CardComment: makeEntityMock("CardComment"),
    ProximitySession: makeEntityMock("ProximitySession"),
    BusinessCard: makeEntityMock("BusinessCard"),
    Subscription: makeEntityMock("Subscription"),
  },
  auth: {
    me: async () => {
      // Mock auth me
      return {
        full_name: "Demo User",
        email: "demo@neuronets.work",
        role: "user",
      };
    },
    logout: (url?: string) => {
      console.log("Mock logout", url);
    },
    redirectToLogin: (url?: string) => {
      console.log("Mock redirectToLogin", url);
    },
  },
};
