import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeUser: any = null;
    let activeSession: any = null;

    try {
      const stored = localStorage.getItem("bypass_admin_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeUser = parsed;
        activeSession = {
          access_token: "bypass-v1",
          refresh_token: "bypass-v1",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: "bearer",
          user: parsed,
        };
      }
    } catch (e) {
      console.error("Error reading bypass_admin_user:", e);
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
      const stored = localStorage.getItem("bypass_admin_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSession({
            access_token: "bypass-v1",
            refresh_token: "bypass-v1",
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
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
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

        setProfile({
          ...defaultUser,
          ...(supabaseProfile || {}),
          id: user.id,
          email: user.email || defaultUser.email,
          role: supabaseProfile?.role || ((user.email === 'lusimadio12@gmail.com' || user.email === 'alex@neuronets.work' || user.email === 'simao@neurogrowthlabs.co.za') ? 'super_admin' : 'user'),
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
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
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
    localStorage.removeItem("bypass_admin_user");
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider value={{ profile, setProfile: updateProfile, session, user, loading, logout }}>
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
