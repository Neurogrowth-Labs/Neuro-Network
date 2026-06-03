-- Supabase Schema for Neuro NetWorks App

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE call_status AS ENUM ('missed', 'completed', 'failed', 'active');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (extends Supabase built-in auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect profiles with Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on re-run
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Contacts Table (For the Vault feature)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  company TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect contacts with RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their contacts" ON public.contacts;
CREATE POLICY "Users can manage their contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);

-- 4. Calls Table (For the Voice Call tracking)
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status call_status DEFAULT 'completed',
  duration_seconds INTEGER DEFAULT 0,
  transcript TEXT, 
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Protect calls with RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their calls" ON public.calls;
CREATE POLICY "Users can manage their calls" ON public.calls FOR ALL USING (auth.uid() = user_id);

-- 5. Notes Table (Meeting Notes during calls & Vault notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE, 
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect notes with RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their notes" ON public.notes;
CREATE POLICY "Users can manage their notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- 6. Notifications Table (For TopNav alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, 
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect notifications with RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their notifications" ON public.notifications;
CREATE POLICY "Users can manage their notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 7. Automated Triggers for timestamp updates (updated_at)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 8. Trigger to create a Profile automatically when a new User signs up on Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
