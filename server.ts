import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { createClient } from "@supabase/supabase-js";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

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

  // 1. AI Chat with Search / Maps Grounding
  app.post("/api/ai/chat", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      
      const { history, prompt, systemInstruction, enableSearch, enableMaps, latLng } = req.body;
      
      // Map user content history to Gemini format
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          });
        });
      }
      
      // Append current user message
      contents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
      
      const tools: any[] = [];
      let toolConfig: any = undefined;
      
      if (enableMaps) {
        tools.push({ googleMaps: {} });
        if (latLng) {
          toolConfig = {
            routingConfig: {}, // blank default config is supported
            retrievalConfig: {
              latLng: {
                latitude: Number(latLng.latitude),
                longitude: Number(latLng.longitude)
              }
            }
          };
        }
      } else if (enableSearch) {
        tools.push({ googleSearch: {} });
      }
      
      const config: any = {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      };
      
      if (tools.length > 0) {
        config.tools = tools;
      }
      if (toolConfig) {
        config.toolConfig = toolConfig;
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config
      });
      
      // Extract search grounding chunks
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || null;
      
      res.json({
        text: response.text,
        groundingChunks
      });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. AI Image Generation
  app.post("/api/ai/image", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      
      const { prompt, aspectRatio, imageSize } = req.body;
      
      // Aspect ratio mapping to comply with API capabilities (1:1, 3:4, 4:3, 9:16, 16:9)
      const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      let selectedAspectRatio = aspectRatio || "1:1";
      if (!validAspectRatios.includes(selectedAspectRatio)) {
        if (selectedAspectRatio === "2:3") selectedAspectRatio = "3:4";
        else if (selectedAspectRatio === "3:2") selectedAspectRatio = "4:3";
        else if (selectedAspectRatio === "21:9") selectedAspectRatio = "16:9";
        else selectedAspectRatio = "1:1";
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: selectedAspectRatio,
            imageSize: imageSize === "4K" || imageSize === "2K" ? "1K" : imageSize || "1K"
          }
        }
      });
      
      let base64ImageBytes = "";
      let responseText = "";
      
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64ImageBytes = part.inlineData.data;
          } else if (part.text) {
            responseText = part.text;
          }
        }
      }
      
      if (!base64ImageBytes) {
        throw new Error("No image data returned from Gemini API");
      }
      
      res.json({
        imageUrl: `data:image/png;base64,${base64ImageBytes}`,
        text: responseText
      });
    } catch (err: any) {
      console.error("AI Image Gen Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Audio Transcription Route
  app.post("/api/ai/transcribe", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      
      const { audioData, mimeType } = req.body;
      if (!audioData) {
        throw new Error("Missing audio data bytes.");
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "audio/webm",
              data: audioData
            }
          },
          {
            text: "Please transcribe this spoken audio. Return ONLY the verbatim transcribed text without any extra conversational remarks or markdown blocks."
          }
        ]
      });
      
      res.json({
        text: response.text || ""
      });
    } catch (err: any) {
      console.error("Audio Transcription Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mock endpoints for the base44 SDK behavior requested with real Firebase & Supabase Sync
  const inMemoryDB: Record<string, any[]> = {
    CardComment: []
  };

  // 1. Initialize Firebase Firestore for server-side persistence
  let firestore: any = null;
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
    console.log("Firebase Firestore initialized successfully in Express Backend!");
  } catch (err: any) {
    console.error("Firebase Firestore backend initialization failed:", err.message);
  }

  // 2. Initialize Supabase Client for server-side persistence
  let supabase: any = null;
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jhlitbcjnvaosvyovfub.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobGl0YmNqbnZhb3N2eW92ZnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODMzOTksImV4cCI6MjA5NjA1OTM5OX0.nu3y7thYPOkh9lPiYjHWs40iyKg5ZZPxQfWGl70eRNM';
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully in Express Backend!");
  } catch (err: any) {
    console.error("Supabase client backend initialization failed:", err.message);
  }

  // Helper to map entity names to standard Supabase/PostgreSQL snake_case plural table names
  const getSupabaseTableName = (entity: string) => {
    const snake = entity.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    if (snake.endsWith('s')) {
      return snake;
    }
    if (snake.endsWith('y')) {
      return snake.slice(0, -1) + 'ies';
    }
    return snake + 's';
  };

  app.get("/api/db/:entity", async (req, res) => {
    const { entity } = req.params;
    let data: any[] = [];
    let loadedFromSupabase = false;

    // A. Read from Supabase (Primary)
    if (supabase) {
      try {
        const tableName = getSupabaseTableName(entity);
        let queryBuilder = supabase.from(tableName).select('*');
        if (req.query.card_id) {
          queryBuilder = queryBuilder.eq('card_id', req.query.card_id);
        } else if (req.query.user_email) {
          queryBuilder = queryBuilder.eq('user_email', req.query.user_email);
        }
        
        const { data: list, error } = await queryBuilder;
        if (!error && list) {
          console.log(`Successfully retrieved ${list.length} '${entity}' records from Supabase [Table: ${tableName}].`);
          data = list;
          loadedFromSupabase = true;
        } else if (error) {
          console.warn(`Supabase select status/note for table '${tableName}':`, error.message);
        }
      } catch (err: any) {
        console.error(`Supabase read failed for '${entity}':`, err.message);
      }
    }

    // B. Fallback to Firebase Firestore (Secondary Backup)
    if (!loadedFromSupabase && firestore) {
      try {
        const colRef = collection(firestore, entity);
        let q = colRef as any;
        if (req.query.card_id) {
          q = query(colRef, where("card_id", "==", req.query.card_id));
        } else if (req.query.user_email) {
          q = query(colRef, where("user_email", "==", req.query.user_email));
        }
        
        const snapshot = await getDocs(q);
        snapshot.forEach((colDoc) => {
          data.push({ id: colDoc.id, ...(colDoc.data() as any) });
        });
        console.log(`Successfully fetched ${data.length} backup records for '${entity}' from Firestore.`);
      } catch (err: any) {
        console.error(`Firestore backup read skipped/failed for '${entity}':`, err.message);
      }
    }

    // C. Fallback to in-memory DB if remote reads returned empty
    if (data.length === 0) {
      data = inMemoryDB[entity] || [];
    }

    res.json(data);
  });

  app.post("/api/db/:entity", async (req, res) => {
    const { entity } = req.params;
    const id = req.body.id || Math.random().toString(36).substring(7);
    const item = { id, ...req.body, created_date: new Date().toISOString() };

    // A. Prioritize Supabase (Primary Write Target)
    if (supabase) {
      try {
        const tableName = getSupabaseTableName(entity);
        const { error } = await supabase
          .from(tableName)
          .insert([item]);
        if (!error) {
          console.log(`Successfully persisted '${entity}' to Supabase table '${tableName}' with ID: ${id}`);
        } else {
          console.warn(`Supabase write issue for table '${tableName}': ${error.message}`);
        }
      } catch (err: any) {
        console.error(`Supabase write exception for table:`, err.message);
      }
    }

    // B. Save to Firebase Firestore (Secondary Sync Target)
    if (firestore) {
      try {
        const docRef = doc(firestore, entity, id);
        await setDoc(docRef, item);
        console.log(`Successfully synced backup '${entity}' to Firestore with ID: ${id}`);
      } catch (err: any) {
        console.error(`Firestore backup sync bypassed for '${entity}':`, err.message);
      }
    }

    // C. Update in-memory
    if (!inMemoryDB[entity]) inMemoryDB[entity] = [];
    inMemoryDB[entity].push(item);

    res.json(item);
  });

  app.put("/api/db/:entity/:id", async (req, res) => {
    const { entity, id } = req.params;
    const updateData = req.body;

    // A. Prioritize Supabase (Primary Update Target)
    if (supabase) {
      try {
        const tableName = getSupabaseTableName(entity);
        const { error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id);
        if (!error) {
          console.log(`Successfully updated '${entity}' in Supabase [${tableName}] with ID: ${id}`);
        } else {
          console.warn(`Supabase update issue: ${error.message}`);
        }
      } catch (err: any) {
        console.error(`Supabase update throw on '${entity}':`, err.message);
      }
    }

    // B. Update in Firestore (Secondary Sync Target)
    if (firestore) {
      try {
        const docRef = doc(firestore, entity, id);
        await setDoc(docRef, updateData, { merge: true });
        console.log(`Successfully synced updated '${entity}' to Firestore with ID: ${id}`);
      } catch (err: any) {
        console.error(`Firestore update sync skipped for '${entity}':`, err.message);
      }
    }

    // C. Update in-memory DB
    if (!inMemoryDB[entity]) inMemoryDB[entity] = [];
    let updated = null;
    inMemoryDB[entity] = inMemoryDB[entity].map(item => {
      if (item.id === id) {
        updated = { ...item, ...updateData };
        return updated;
      }
      return item;
    });

    res.json(updated || {});
  });

  app.delete("/api/db/:entity/:id", async (req, res) => {
    const { entity, id } = req.params;

    // A. Prioritize Supabase (Primary Delete Target)
    if (supabase) {
      try {
        const tableName = getSupabaseTableName(entity);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        if (!error) {
          console.log(`Successfully deleted '${entity}' from Supabase [${tableName}] with ID: ${id}`);
        } else {
          console.warn(`Supabase deletion issue: ${error.message}`);
        }
      } catch (err: any) {
        console.error(`Supabase delete exception for '${entity}':`, err.message);
      }
    }

    // B. Delete in Firestore (Secondary Sync Target)
    if (firestore) {
      try {
        const docRef = doc(firestore, entity, id);
        await deleteDoc(docRef);
        console.log(`Successfully deleted backup '${entity}' from Firestore with ID: ${id}`);
      } catch (err: any) {
        console.error(`Firestore backup delete bypassed for '${entity}':`, err.message);
      }
    }

    // C. Delete from in-memory
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
