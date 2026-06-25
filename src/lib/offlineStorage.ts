/**
 * High-performance, lightweight IndexedDB wrapper for local business card caching
 * and offline-first availability.
 */

const DB_NAME = "digital_card_offline_db";
const DB_VERSION = 1;

export interface OfflineCard {
  id: string;
  full_name: string;
  job_title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  bio?: string;
  theme?: string;
  template?: string;
  avatar_url?: string;
  profile_photo?: string;
  industry?: string;
  status?: string;
  updatedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("profiles")) {
        db.createObjectStore("profiles", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("contacts")) {
        db.createObjectStore("contacts", { keyPath: "id" });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      console.error("IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Persists the user's main digital card profile to local IndexedDB.
 */
export async function saveProfileOffline(profile: any): Promise<void> {
  if (!profile || !profile.id) return;
  try {
    const db = await openDB();
    const tx = db.transaction("profiles", "readwrite");
    const store = tx.objectStore("profiles");
    store.put({
      ...profile,
      updatedAt: new Date().toISOString(),
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save profile to IndexedDB:", error);
  }
}

/**
 * Retrieves the user's main digital card profile from local IndexedDB.
 */
export async function getProfileOffline(id: string): Promise<any | null> {
  if (!id) return null;
  try {
    const db = await openDB();
    const tx = db.transaction("profiles", "readonly");
    const store = tx.objectStore("profiles");
    const request = store.get(id);

    return await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error("Failed to get profile from IndexedDB:", error);
    return null;
  }
}

/**
 * Persists an array of exchanged contacts to local IndexedDB.
 */
export async function saveContactsOffline(contacts: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("contacts", "readwrite");
    const store = tx.objectStore("contacts");

    // Clear existing contacts first to prevent stale references
    store.clear();

    for (const contact of contacts) {
      if (contact.id) {
        store.put({
          ...contact,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save contacts to IndexedDB:", error);
  }
}

/**
 * Retrieves cached business cards and contacts from local IndexedDB.
 */
export async function getContactsOffline(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction("contacts", "readonly");
    const store = tx.objectStore("contacts");
    const request = store.getAll();

    return await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error("Failed to get contacts from IndexedDB:", error);
    return [];
  }
}
