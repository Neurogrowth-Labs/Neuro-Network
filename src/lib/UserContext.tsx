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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116' && error.code !== '42501') {
           console.error('Database query error:', error);
        }
        
        if (data) {
          setProfile({
            ...defaultUser,
            ...data,
            id: user.id,
            email: user.email || defaultUser.email,
          });
        } else {
          setProfile({ ...defaultUser, id: user.id, email: user.email || defaultUser.email });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider value={{ profile, setProfile, session, user, loading, logout }}>
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
