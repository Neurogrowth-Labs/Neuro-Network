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

export type UserProfile = typeof defaultUser & { id?: string };

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    }).catch(error => {
      console.error("Supabase getSession error:", error);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

        let firestoreProfile: any = null;
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          const profileDoc = await getDoc(doc(db, 'profiles', user.id));
          if (profileDoc.exists()) {
            firestoreProfile = profileDoc.data();
          }
        } catch (e) {
          console.error("Firestore load error:", e);
        }

        setProfile({
          ...defaultUser,
          ...(supabaseProfile || {}),
          ...(firestoreProfile || {}),
          id: user.id,
          email: user.email || defaultUser.email,
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
          avatar_url: nextProfile.avatar_url || '',
          updated_at: new Date().toISOString()
        });
      if (error && error.code !== '42501') {
        console.error("Error upserting profile in Supabase:", error);
      }
    } catch (e) {
      console.error("Supabase upsert failed:", e);
    }

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const profileDocRef = doc(db, 'profiles', user.id);
      await setDoc(profileDocRef, {
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
      }, { merge: true });
      console.log("Successfully updated profile in Firestore!");
    } catch (e) {
      console.error("Firestore update failed:", e);
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
    await supabase.auth.signOut();
    import('./firebase').then(m => m.logout());
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
