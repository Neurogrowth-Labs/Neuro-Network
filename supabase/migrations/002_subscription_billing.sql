-- Subscription and billing system for Premium Monthly (R250/month).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'past_due', 'inactive')),
  ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'Premium Monthly',
  ADD COLUMN IF NOT EXISTS subscription_provider text,
  ADD COLUMN IF NOT EXISTS provider_customer_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_transaction_id text,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_active_until timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

UPDATE public.profiles
SET trial_started_at = COALESCE(trial_started_at, created_at, timezone('utc', now())),
    trial_expires_at = COALESCE(trial_expires_at, COALESCE(created_at, timezone('utc', now())) + interval '7 days')
WHERE trial_started_at IS NULL OR trial_expires_at IS NULL;

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  event_type text NOT NULL,
  provider text,
  provider_event_id text UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  provider text NOT NULL,
  transaction_id text NOT NULL UNIQUE,
  provider_subscription_id text,
  amount_cents integer NOT NULL DEFAULT 25000,
  currency text NOT NULL DEFAULT 'ZAR',
  status text NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON public.profiles(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_billing_history_user ON public.billing_history(user_id, paid_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing history" ON public.billing_history FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can manage billing history" ON public.billing_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can view subscription events" ON public.subscription_events FOR SELECT USING (public.is_admin());
