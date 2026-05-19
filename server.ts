import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API constraints check
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // LLM endpoint simulating base44 InvokeLLM
  app.post("/api/llm", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      
      const { prompt, response_json_schema } = req.body;
      
      const config: any = {};
      
      if (response_json_schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = response_json_schema;
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config
      });
      
      const text = response.text;
      
      if (response_json_schema) {
        // parse the returned JSON string just to be safe
        try {
          const jsonVal = JSON.parse(text);
          return res.json(jsonVal);
        } catch (e) {
          // If it didn't parse clean, return as text
          return res.send(text);
        }
      }
      
      return res.send(text);
    } catch (err: any) {
      console.error("LLM Error:", err);
      // Wait for 1 second just so UI doesn't flash errors instantly
      await new Promise(r => setTimeout(r, 1000));
      res.status(500).json({ error: err.message });
    }
  });

  // Mock endpoints for the base44 SDK behavior requested
  const inMemoryDB: Record<string, any[]> = {
    CardComment: []
  };

  app.get("/api/db/:entity", (req, res) => {
    const { entity } = req.params;
    let data = inMemoryDB[entity] || [];
    // simplistic filter
    if (req.query.card_id) {
       data = data.filter(d => d.card_id === req.query.card_id);
    }
    res.json(data);
  });

  app.post("/api/db/:entity", (req, res) => {
    const { entity } = req.params;
    if (!inMemoryDB[entity]) inMemoryDB[entity] = [];
    const item = { id: Math.random().toString(36).substring(7), ...req.body, created_date: new Date().toISOString() };
    inMemoryDB[entity].push(item);
    res.json(item);
  });

  app.put("/api/db/:entity/:id", (req, res) => {
    const { entity, id } = req.params;
    if (!inMemoryDB[entity]) inMemoryDB[entity] = [];
    let updated = null;
    inMemoryDB[entity] = inMemoryDB[entity].map(item => {
      if (item.id === id) {
        updated = { ...item, ...req.body };
        return updated;
      }
      return item;
    });
    res.json(updated || {});
  });

  app.delete("/api/db/:entity/:id", (req, res) => {
    const { entity, id } = req.params;
    if (!inMemoryDB[entity]) inMemoryDB[entity] = [];
    inMemoryDB[entity] = inMemoryDB[entity].filter(item => item.id !== id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
