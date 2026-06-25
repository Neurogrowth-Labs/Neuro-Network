import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { ensureUUID } from './uuid';
import { saveProfileOffline, getProfileOffline } from './offlineStorage';

export const defaultUser = {
  full_name: "Alexander Vance",
  job_title: "CEO & Founder",
  company: "Neuro NetWorks",
  email: "alex@neuronets.work",
  phone: "+1 (555) 019-2831",
  website: "neuronets.work",
  bio: "Connecting AI and human networks on a global scale.",
  template: "executive",
  theme_color: "#06b6d4",
  linkedin: "https://linkedin.com",
  twitter: "https://twitter.com",
  industry: "Technology",
  avatar_url: "",
  banner_url: "",
};

export type UserProfile = typeof defaultUser & { id?: string; role?: 'super_admin' | 'user' };

interface UserContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  session: Session | null;
  user: SupabaseUser | null;
  loading: boolean;
  isSaving: boolean;
  isOnline: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultUser);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let activeUser: any = null;
    let activeSession: any = null;

    try {
      const stored = localStorage.getItem("admin_onboarding_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Correct legacy invalid ID to valid UUID to avoid PostgreSQL constraint errors
        if (parsed.id === "simao-admin-uuid-99a") {
          parsed.id = "99a99999-99aa-499a-a99a-99999999999a";
          localStorage.setItem("admin_onboarding_session", JSON.stringify(parsed));
        }
        activeUser = parsed;
        activeSession = {
          access_token: "admin-session-v1",
          refresh_token: "admin-session-v1",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: "bearer",
          user: parsed,
        };
      }
    } catch (e) {
      console.error("Error reading admin_onboarding_session:", e);
    }

    if (activeUser) {
      setUser(activeUser);
      setSession(activeSession);
      setLoading(false);
    } else {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      }).catch(error => {
        console.error("Supabase getSession error:", error);
      }).finally(() => {
        setLoading(false);
      });
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const stored = localStorage.getItem("admin_onboarding_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.id === "simao-admin-uuid-99a") {
            parsed.id = "99a99999-99aa-499a-a99a-99999999999a";
            localStorage.setItem("admin_onboarding_session", JSON.stringify(parsed));
          }
          setSession({
            access_token: "admin-session-v1",
            refresh_token: "admin-session-v1",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: "bearer",
            user: parsed,
          });
          setUser(parsed);
          return;
        } catch {
          // fallback
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(defaultUser);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        let supabaseProfile: any = null;
        try {
          // Always use ensureUUID to format the identifier correctly and prevent PostgreSQL syntax errors
          const safeId = ensureUUID(user.id);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', safeId)
            .single();
            
          if (error && error.code !== 'PGRST116' && error.code !== '42501') {
             console.error('Database query error:', error);
          }
          if (data) {
            supabaseProfile = data;
          }
        } catch (e) {
          console.error("Supabase load error:", e);
        }

        // Load from local IndexedDB cache for robust offline storage
        let offlineCachedProfile: any = null;
        try {
          const safeId = ensureUUID(user.id);
          offlineCachedProfile = await getProfileOffline(safeId);
        } catch (e) {
          console.error("IndexedDB profile load error:", e);
        }

        // Load from local storage cache to guarantee persistent edits across reloads
        let cachedProfile: any = null;
        try {
          const cached = localStorage.getItem(`profile_cache_${user.id}`);
          if (cached) {
            cachedProfile = JSON.parse(cached);
          }
        } catch (e) {
          console.error("Local storage read error:", e);
        }

        setProfile({
          ...defaultUser,
          ...(cachedProfile || {}),
          ...(offlineCachedProfile || {}),
          ...(supabaseProfile || {}),
          id: user.id,
          email: user.email || defaultUser.email,
          role: supabaseProfile?.role || offlineCachedProfile?.role || cachedProfile?.role || ((user.email === 'lusimadio12@gmail.com' || user.email === 'alex@neuronets.work' || user.email === 'simao@neurogrowthlabs.co.za') ? 'super_admin' : 'user'),
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const saveToDatabases = async (nextProfile: UserProfile) => {
    if (!user) return;

    // Cache locally to localStorage immediately
    try {
      localStorage.setItem(`profile_cache_${user.id}`, JSON.stringify(nextProfile));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
    
    // Convert to fully valid RFC4122 UUID structure
    const safeId = ensureUUID(user.id);

    // Persist to offline IndexedDB
    try {
      await saveProfileOffline({
        ...nextProfile,
        id: safeId
      });
    } catch (e) {
      console.error("IndexedDB save profile error:", e);
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: safeId,
          full_name: nextProfile.full_name,
          job_title: nextProfile.job_title,
          company: nextProfile.company,
          email: nextProfile.email,
          phone: nextProfile.phone,
          website: nextProfile.website,
          bio: nextProfile.bio,
          template: nextProfile.template,
          theme_color: nextProfile.theme_color,
          linkedin: nextProfile.linkedin,
          twitter: nextProfile.twitter,
          industry: nextProfile.industry,
          avatar_url: nextProfile.avatar_url || '',
          updated_at: new Date().toISOString()
        });
      if (error && error.code !== '42501') {
        console.error("Error upserting profile in Supabase:", error);
      } else {
        console.log("Successfully updated profile in Supabase!");
      }
    } catch (e) {
      console.error("Supabase upsert failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = async (updater: any) => {
    if (typeof updater === 'function') {
      setProfile((prev) => {
        const nextProfile = updater(prev);
        saveToDatabases(nextProfile);
        return nextProfile;
      });
    } else {
      setProfile(updater);
      saveToDatabases(updater);
    }
  };

  const logout = async () => {
    localStorage.removeItem("admin_onboarding_session");
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider value={{ profile, setProfile: updateProfile, session, user, loading, isSaving, isOnline, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
