-- KYC/KYB security infrastructure inspired by open-source KYC/KYB workflows.
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  user_email text NOT NULL,
  verification_type text NOT NULL DEFAULT 'individual' CHECK (verification_type IN ('individual', 'business')),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'pending', 'verified', 'rejected', 'expired')),
  provider text NOT NULL DEFAULT 'open_source_kyc_kyb',
  reference_id text UNIQUE NOT NULL DEFAULT ('kyc_' || replace(gen_random_uuid()::text, '-', '')),
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user ON public.kyc_verifications(user_email);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON public.kyc_verifications(status);
DROP TRIGGER IF EXISTS kyc_verifications_updated_at ON public.kyc_verifications;
CREATE TRIGGER kyc_verifications_updated_at BEFORE UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kyc_verifications_owner" ON public.kyc_verifications;
CREATE POLICY "kyc_verifications_owner" ON public.kyc_verifications FOR ALL USING (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR user_email = (auth.jwt()->>'email') OR public.is_admin());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'not_started';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_reference text NOT NULL DEFAULT '';
