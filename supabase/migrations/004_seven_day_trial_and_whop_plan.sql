-- Enforce the current 7-day first-time user trial window.
-- New profiles get a trial start immediately and expire exactly 7 days later.
ALTER TABLE public.profiles
  ALTER COLUMN trial_started_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN trial_expires_at SET DEFAULT (timezone('utc', now()) + interval '7 days'),
  ALTER COLUMN subscription_status SET DEFAULT 'trial',
  ALTER COLUMN subscription_plan SET DEFAULT 'Premium Monthly';

-- Backfill only missing trial windows without extending existing user trials.
UPDATE public.profiles
SET trial_started_at = COALESCE(trial_started_at, created_at, timezone('utc', now())),
    trial_expires_at = COALESCE(trial_expires_at, COALESCE(created_at, timezone('utc', now())) + interval '7 days'),
    subscription_status = COALESCE(subscription_status, 'trial'),
    subscription_plan = COALESCE(subscription_plan, 'Premium Monthly')
WHERE trial_started_at IS NULL
   OR trial_expires_at IS NULL
   OR subscription_status IS NULL
   OR subscription_plan IS NULL;
