-- ======================================================================================
-- NEURONET DIGITAL CONTROL CENTER - COMPREHENSIVE BACKEND DATABASE SCHEMA & INFRASTRUCTURE
-- ======================================================================================
-- Designed for direct pasting into the Supabase SQL Editor.
-- Configures Tables, Relationships, Automatic Registration Triggers, Enums, and Row
-- Level Security (RLS) Policies separating Normal Users from elevated Super Admin privileges.
-- Securely synchronizes simao@neurogrowthlabs.co.za, lusimadio12@gmail.com, alex@neuronets.work.
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. SYS EXTENSIONS SETUP
-- --------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------------------------
-- 2. ENUMS & TYPE INTEGRITY CONSTRAINTS
-- --------------------------------------------------------------------------------------
-- Create status & role types if they don't already exist (handled safely using PL/pgSQL block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('Active', 'Suspended', 'Pending');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'executive', 'manager', 'individual');
    END IF;
END$$;

-- --------------------------------------------------------------------------------------
-- 3. CORE PLATFORM TABLES CREATION
-- --------------------------------------------------------------------------------------

-- A. PROFILES (EXECUTIVE DIGITAL CARDS & DIRECTORY CONFIGS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name text NOT NULL DEFAULT 'Anonymous Member',
    job_title text DEFAULT 'Network Consultant',
    company text DEFAULT 'Neuro NetWorks',
    email text UNIQUE NOT NULL,
    phone text,
    website text DEFAULT 'neuronets.work',
    bio text DEFAULT 'Connecting AI and human networks on a global scale.',
    template text NOT NULL DEFAULT 'executive',
    theme_color text NOT NULL DEFAULT '#06b6d4',
    linkedin text DEFAULT 'https://linkedin.com',
    twitter text DEFAULT 'https://twitter.com',
    industry text DEFAULT 'Technology',
    avatar_url text DEFAULT '',
    banner_url text DEFAULT '',
    status text NOT NULL DEFAULT 'Active', -- For code compatibility we keep status & role as text with constraints
    role text NOT NULL DEFAULT 'individual',
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT chk_profile_status CHECK (status IN ('Active', 'Suspended', 'Pending')),
    CONSTRAINT chk_profile_role CHECK (role IN ('super_admin', 'executive', 'manager', 'individual'))
);

-- B. CONTACTS (THE CENTRAL CARD SECURE VAULT EXCHANGE CATALOG)
CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    first_name text NOT NULL,
    last_name text DEFAULT '',
    company text DEFAULT '',
    email text,
    phone text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- C. NOTES (AI-SUMMARY MEETING TRACES & TELEMETRY NOTES DIAGNOSTICS)
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. NOTIFICATIONS (FOR MASS BROADCAST OUTREACH CAMPAIGNS & TRANSITIONS ALERTINGS)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL DEFAULT 'system',
    content text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. SECURITY AUDIT LOGS (PLATFORM CONTROL CENTER TRAILING)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email text NOT NULL,
    action text NOT NULL,
    details text NOT NULL,
    level text NOT NULL DEFAULT 'INFO',
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT chk_audit_level CHECK (level IN ('INFO', 'SECURITY', 'PERFORMANCE', 'BROADCAST'))
);

-- --------------------------------------------------------------------------------------
-- 4. DATABASE SECURITY HELPER UTILITIES
-- --------------------------------------------------------------------------------------

-- Returns true if the requesting caller is in the authorized Super Admin email pool,
-- or has a registered super_admin role tag inside the database profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
    caller_email text;
    caller_role text;
BEGIN
    -- 1. Extract session parameters securely from JWT payload claims
    caller_email := nullif(current_setting('request.jwt.claim.email', true), '');
    
    -- 2. Immediate checklist matching principal platform command credentials
    IF caller_email IN ('simao@neurogrowthlabs.co.za', 'lusimadio12@gmail.com', 'alex@neuronets.work') THEN
        RETURN true;
    END IF;

    -- 3. Fallback table catalog query logic
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
        IF caller_role = 'super_admin' THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------------------------
-- 5. SECURE AUTOMATIC REGISTRATION USER TRIGGER
-- --------------------------------------------------------------------------------------
-- Auto-provisions a corresponding public.profiles row upon metadata registration signup.
-- Correctly handles the special administrative privilege elevation list.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    assigned_role text := 'individual';
BEGIN
    -- Elevate known platform administrators upon signup automatically
    IF NEW.email IN ('simao@neurogrowthlabs.co.za', 'lusimadio12@gmail.com', 'alex@neuronets.work') THEN
        assigned_role := 'super_admin';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        status,
        avatar_url,
        job_title,
        company
    ) VALUES (
        NEW.id,
        coalesce(NEW.raw_user_meta_data->>'full_name', 'Anonymous Member'),
        NEW.email,
        assigned_role,
        'Active',
        coalesce(NEW.raw_user_meta_data->>'avatar_url', ''),
        case when assigned_role = 'super_admin' then 'Platform Owner & Architect' else 'Network Consultant' end,
        case when assigned_role = 'super_admin' then 'Simao Digital Holdings' else 'Neuro NetWorks' end
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to prevent duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bind the trigger to target schema auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES & REVENUE CONTROLS
-- --------------------------------------------------------------------------------------

-- Turn on Row Level Security for all datasets
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
-- A. Read policies: 
-- 1. Anyone can view public profile details to enable networking card sharing.
CREATE POLICY "Enable read access for all unified network shares"
    ON public.profiles FOR SELECT
    USING (status = 'Active');

-- 2. Super admins can select all profiles regardless of status.
CREATE POLICY "Super admin wildcard read for all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

-- B. Modify policies:
-- 1. Users can update only their own cards if not suspended.
CREATE POLICY "Users can update personal card profile details"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id AND status = 'Active')
    WITH CHECK (auth.uid() = id AND status = 'Active');

-- 2. Super admins can insert, update, or remove any core profile record.
CREATE POLICY "Super admin full control on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ==========================================
-- CONTACTS POLICIES
-- ==========================================
-- 1. Users can view/create/alter their personal vaults.
CREATE POLICY "Users can fully manage personal connections"
    ON public.contacts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Super admins can review, trace, and prune all contact listings.
CREATE POLICY "Super admin access on vaults"
    ON public.contacts FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ==========================================
-- NOTES POLICIES
-- ==========================================
-- 1. Normal users can manage their own transcripts.
CREATE POLICY "Users can manage personal transcripts"
    ON public.notes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Super admins can manage all global platform transcripts.
CREATE POLICY "Super admin access on logs transcripts"
    ON public.notes FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================
-- 1. Users can review/dismiss their target notifications.
CREATE POLICY "Users can manage individual notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Super admins can push announcements to anyone.
CREATE POLICY "Super admin access on announcements board"
    ON public.notifications FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ==========================================
-- AUDIT LOGS POLICIES
-- ==========================================
-- 1. Audit traces are highly restricted. Users cannot see or touch audits.
-- 2. Super admins can read and append security audits.
CREATE POLICY "Super admin access on platform audit trails"
    ON public.audit_logs FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------------------------
-- 7. AUTOMATIC SYSTEM SYNCHRONIZATION DIAGNOSTICS
-- --------------------------------------------------------------------------------------
-- Provides high speed lookup indexes on database fields to optimize performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_level ON public.audit_logs(level);

-- ======================================================================================
-- F. BIOMETRIC CREDENTIALS (SECURE WEB-AUTH MICROSIGNATURES)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.biometric_credentials (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email text NOT NULL,
    credential_id text NOT NULL,
    type text NOT NULL,
    raw_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage biometric credentials"
    ON public.biometric_credentials FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_biometric_user ON public.biometric_credentials(user_email);