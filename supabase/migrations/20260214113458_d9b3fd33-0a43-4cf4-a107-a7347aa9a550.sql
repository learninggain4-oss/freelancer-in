
-- Function to get referral history for the current user
CREATE OR REPLACE FUNCTION public.get_referral_history()
RETURNS TABLE(
  referral_id uuid,
  referred_name text,
  referred_user_type text,
  signup_bonus_paid boolean,
  job_bonus_paid boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
  IF v_profile_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
    SELECT
      r.id,
      p.full_name[1],
      p.user_type::text,
      r.signup_bonus_paid,
      r.job_bonus_paid,
      r.created_at
    FROM referrals r
    JOIN profiles p ON p.id = r.referred_id
    WHERE r.referrer_id = v_profile_id
    ORDER BY r.created_at DESC;
END;
$$;
