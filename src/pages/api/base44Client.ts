  },
  create: async (data: any) =>
    requestJson(`/api/db/${name}`, {
      method: "POST",
      body: JSON.stringify(data),
  },
  subscribe: (_callback?: unknown) => () => {},
});

const getCurrentUser = async () => {
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
      if (url) window.location.assign(url);
    },
    redirectToLogin: (url?: string) => {
      const target = url || window.location.href;
      window.location.assign(`/auth?redirect=${encodeURIComponent(target)}`);
    },
  },
};
