-- Neuro NetWorks canonical Supabase backend schema
-- Paste this complete file into the Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status') THEN
    CREATE TYPE call_status AS ENUM ('missed', 'completed', 'failed', 'active');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  caller_email text;
  caller_role text;
BEGIN
  caller_email := nullif(current_setting('request.jwt.claim.email', true), '');
  IF caller_email IN ('simao@neurogrowthlabs.co.za', 'lusimadio12@gmail.com', 'alex@neuronets.work') THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    RETURN caller_role = 'super_admin';
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  job_title text DEFAULT '',
  company text DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  website text DEFAULT '',
  bio text DEFAULT '',
  template text NOT NULL DEFAULT 'executive',
  theme_color text NOT NULL DEFAULT '#06b6d4',
  linkedin text DEFAULT '',
  twitter text DEFAULT '',
  industry text DEFAULT '',
  avatar_url text DEFAULT '',
  banner_url text DEFAULT '',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Pending')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'executive', 'manager', 'individual', 'user')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  user_email text NOT NULL,
  card_slug text UNIQUE,
  full_name text NOT NULL DEFAULT '',
  job_title text DEFAULT '',
  company text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  website text DEFAULT '',
  bio text DEFAULT '',
  template text NOT NULL DEFAULT 'executive',
  theme_color text NOT NULL DEFAULT '#06b6d4',
  linkedin text DEFAULT '',
  twitter text DEFAULT '',
  industry text DEFAULT '',
  avatar_url text DEFAULT '',
  banner_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_date timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  first_name text NOT NULL DEFAULT '',
  last_name text DEFAULT '',
  full_name text GENERATED ALWAYS AS (trim(both ' ' from first_name || ' ' || coalesce(last_name, ''))) STORED,
  job_title text DEFAULT '',
  title text DEFAULT '',
  company text DEFAULT '',
  industry text DEFAULT '',
  role_level text DEFAULT '',
  opportunity_type text DEFAULT '',
  contact_score integer DEFAULT 0 CHECK (contact_score >= 0 AND contact_score <= 100),
  ai_tags text[] NOT NULL DEFAULT '{}',
  ai_summary text DEFAULT '',
  met_at text DEFAULT '',
  notes text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  profile_photo text DEFAULT '',
  avatar_url text DEFAULT '',
  follow_up_done boolean NOT NULL DEFAULT false,
  follow_up_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  call_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  status call_status DEFAULT 'completed',
  duration_seconds integer DEFAULT 0,
  transcript text,
  started_at timestamptz DEFAULT timezone('utc'::text, now()),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  type text NOT NULL DEFAULT 'system',
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  level text NOT NULL DEFAULT 'INFO' CHECK (level IN ('INFO', 'SECURITY', 'PERFORMANCE', 'BROADCAST')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.card_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'suggestion', 'approval')),
  author_name text DEFAULT '',
  author_email text DEFAULT '',
  resolved boolean NOT NULL DEFAULT false,
  created_date timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.proximity_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  user_email text NOT NULL,
  user_name text DEFAULT '',
  card_id text DEFAULT '',
  card_slug text DEFAULT '',
  event_name text NOT NULL,
  latitude double precision,
  longitude double precision,
  proximity_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  expires_at timestamptz NOT NULL,
  created_date timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  user_email text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_date timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.biometric_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  user_email text NOT NULL,
  credential_id text NOT NULL,
  type text NOT NULL,
  raw_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_business_cards_user ON public.business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON public.card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_proximity_sessions_user ON public.proximity_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_proximity_sessions_event ON public.proximity_sessions(event_name, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_biometric_user ON public.biometric_credentials(user_email);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS business_cards_updated_at ON public.business_cards;
CREATE TRIGGER business_cards_updated_at BEFORE UPDATE ON public.business_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS card_comments_updated_at ON public.card_comments;
CREATE TRIGGER card_comments_updated_at BEFORE UPDATE ON public.card_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS proximity_sessions_updated_at ON public.proximity_sessions;
CREATE TRIGGER proximity_sessions_updated_at BEFORE UPDATE ON public.proximity_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role text := 'user';
BEGIN
  IF NEW.email IN ('simao@neurogrowthlabs.co.za', 'lusimadio12@gmail.com', 'alex@neuronets.work') THEN
    assigned_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), EXCLUDED.full_name),
    avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), EXCLUDED.avatar_url),
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proximity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (status = 'Active' OR auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "business_cards_owner" ON public.business_cards;
CREATE POLICY "business_cards_owner" ON public.business_cards FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "business_cards_public_read" ON public.business_cards;
CREATE POLICY "business_cards_public_read" ON public.business_cards FOR SELECT USING (is_active = true OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "contacts_owner" ON public.contacts;
CREATE POLICY "contacts_owner" ON public.contacts FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "notes_owner" ON public.notes;
CREATE POLICY "notes_owner" ON public.notes FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "calls_owner" ON public.calls;
CREATE POLICY "calls_owner" ON public.calls FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "notifications_owner" ON public.notifications;
CREATE POLICY "notifications_owner" ON public.notifications FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "audit_admin" ON public.audit_logs;
CREATE POLICY "audit_admin" ON public.audit_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "card_comments_authenticated" ON public.card_comments;
CREATE POLICY "card_comments_authenticated" ON public.card_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "proximity_sessions_owner" ON public.proximity_sessions;
CREATE POLICY "proximity_sessions_owner" ON public.proximity_sessions FOR ALL USING (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin());
DROP POLICY IF EXISTS "subscriptions_owner" ON public.subscriptions;
CREATE POLICY "subscriptions_owner" ON public.subscriptions FOR ALL USING (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin());
DROP POLICY IF EXISTS "biometric_credentials_owner" ON public.biometric_credentials;
CREATE POLICY "biometric_credentials_owner" ON public.biometric_credentials FOR ALL USING (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles, public.business_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
