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

  app.get("/api/db/:entity", async (req, res) => {
    const { entity } = req.params;
    let data: any[] = [];
    let loadedFromFirestore = false;

    // A. Read from Firebase Firestore
    if (firestore) {
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
        loadedFromFirestore = true;
        console.log(`Successfully fetched ${data.length} records for '${entity}' from Firestore.`);
      } catch (err: any) {
        console.error(`Firestore read failed for '${entity}':`, err.message);
      }
    }

    // B. Read from Supabase (fallback/parallel verification if table exists)
    if (supabase) {
      try {
        const tableName = entity.toLowerCase() + 's';
        const { data: list, error } = await supabase
          .from(tableName)
          .select('*');
        if (!error && list && list.length > 0) {
          console.log(`Successfully retrieved '${entity}' records from Supabase.`);
          if (!loadedFromFirestore) {
            data = list;
          }
        }
      } catch (err) {
        // Table might not exist yet, skip gracefully
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
    const id = Math.random().toString(36).substring(7);
    const item = { id, ...req.body, created_date: new Date().toISOString() };

    // A. Save to Firebase Firestore
    if (firestore) {
      try {
        const docRef = doc(firestore, entity, id);
        await setDoc(docRef, item);
        console.log(`Successfully saved '${entity}' to Firestore with ID: ${id}`);
      } catch (err: any) {
        console.error(`Firestore write failed for '${entity}':`, err.message);
      }
    }

    // B. Save to Supabase
    if (supabase) {
      try {
        const tableName = entity.toLowerCase() + 's';
        const { error } = await supabase
          .from(tableName)
          .insert([item]);
        if (!error) {
          console.log(`Successfully sync'ed '${entity}' to Supabase with ID: ${id}`);
        } else {
          console.warn(`Supabase sync note for table '${tableName}': ${error.message}`);
        }
      } catch (err) {
        // Table might not exist, skip gracefully
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

    // A. Update in Firestore
    if (firestore) {
      try {
        const docRef = doc(firestore, entity, id);
        await setDoc(docRef, updateData, { merge: true });
        console.log(`Successfully updated '${entity}' in Firestore with ID: ${id}`);
      } catch (err: any) {
        console.error(`Firestore update failed for '${entity}':`, err.message);
      }
    }

    // B. Update in Supabase
    if (supabase) {
      try {
        const tableName = entity.toLowerCase() + 's';
        const { error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id);
        if (!error) {
          console.log(`Successfully updated '${entity}' in Supabase with ID: ${id}`);
        }
      } catch (err) {
        // Skip
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

    // A. Delete in Firestore
    if (firestore) {
      try {
        const docRef = doc(firestore, entity, id);
        await deleteDoc(docRef);
        console.log(`Successfully deleted '${entity}' from Firestore with ID: ${id}`);
      } catch (err: any) {
        console.error(`Firestore delete failed for '${entity}':`, err.message);
      }
    }

    // B. Delete in Supabase
    if (supabase) {
      try {
        const tableName = entity.toLowerCase() + 's';
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        if (!error) {
          console.log(`Successfully deleted '${entity}' from Supabase with ID: ${id}`);
        }
      } catch (err) {
        // Skip
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
