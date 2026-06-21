
-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = UPPER(SUBSTRING(id::text FROM 1 FOR 8));

-- Make it NOT NULL after populating
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

-- Create trigger to auto-generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 4) || SUBSTRING(md5(random()::text) FROM 1 FOR 4));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Referral tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referred_id uuid NOT NULL REFERENCES public.profiles(id),
  signup_bonus_paid boolean NOT NULL DEFAULT false,
  job_bonus_paid boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Deny anon access to referrals"
ON public.referrals FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Users can view own referrals as referrer"
ON public.referrals FOR SELECT TO authenticated
USING (referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add referred_by to profiles (nullable, set during registration)
ALTER TABLE public.profiles ADD COLUMN referred_by text;

-- Insert default referral settings into app_settings
INSERT INTO public.app_settings (key, value) VALUES
  ('referral_signup_bonus', '10'),
  ('referral_job_bonus', '90'),
  ('referral_terms_conditions', 'Invite your friends and earn rewards!\n\n1. Share your unique referral code with friends.\n2. When your friend signs up using your code, you earn ₹10.\n3. When your friend completes their first job/project, you earn ₹90.\n4. Total referral bonus: ₹100 per successful referral.\n5. Bonuses are credited to your wallet automatically.\n6. This offer is subject to change at the admin''s discretion.')
ON CONFLICT (key) DO NOTHING;
