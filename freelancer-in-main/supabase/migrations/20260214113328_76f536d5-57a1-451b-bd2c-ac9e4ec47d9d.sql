
-- Update signup bonus trigger to also create a notification
CREATE OR REPLACE FUNCTION public.credit_referral_signup_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_user_id uuid;
  v_bonus numeric;
  v_referral_id uuid;
BEGIN
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status <> 'approved') THEN
    IF NEW.referred_by IS NOT NULL AND NEW.referred_by <> '' THEN
      SELECT id, user_id INTO v_referrer_id, v_referrer_user_id FROM profiles WHERE referral_code = NEW.referred_by LIMIT 1;
      
      IF v_referrer_id IS NOT NULL AND v_referrer_id <> NEW.id THEN
        INSERT INTO referrals (referrer_id, referred_id)
        VALUES (v_referrer_id, NEW.id)
        ON CONFLICT (referred_id) DO NOTHING;

        SELECT id INTO v_referral_id FROM referrals WHERE referred_id = NEW.id AND referrer_id = v_referrer_id AND signup_bonus_paid = false;

        IF v_referral_id IS NOT NULL THEN
          SELECT COALESCE(value::numeric, 10) INTO v_bonus FROM app_settings WHERE key = 'referral_signup_bonus';
          IF v_bonus IS NULL THEN v_bonus := 10; END IF;

          UPDATE profiles SET available_balance = available_balance + v_bonus WHERE id = v_referrer_id;

          INSERT INTO transactions (profile_id, amount, type, description, reference_id)
          VALUES (v_referrer_id, v_bonus, 'credit', 'Referral signup bonus for ' || NEW.full_name[1], v_referral_id);

          UPDATE referrals SET signup_bonus_paid = true WHERE id = v_referral_id;

          -- Send notification to referrer
          INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
          VALUES (
            v_referrer_user_id,
            'Referral Bonus Earned! 🎉',
            'Your friend ' || NEW.full_name[1] || ' just signed up using your referral code. ₹' || v_bonus || ' has been credited to your wallet!',
            'info',
            'referral',
            v_referral_id
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Update job bonus trigger to also create a notification
CREATE OR REPLACE FUNCTION public.credit_referral_job_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_profile_id uuid;
  v_referral_row record;
  v_referrer_user_id uuid;
  v_bonus numeric;
  v_referred_name text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') AND NEW.assigned_employee_id IS NOT NULL THEN
    v_employee_profile_id := NEW.assigned_employee_id;

    SELECT r.id, r.referrer_id INTO v_referral_row
    FROM referrals r
    WHERE r.referred_id = v_employee_profile_id AND r.job_bonus_paid = false
    LIMIT 1;

    IF v_referral_row IS NOT NULL THEN
      SELECT COALESCE(value::numeric, 90) INTO v_bonus FROM app_settings WHERE key = 'referral_job_bonus';
      IF v_bonus IS NULL THEN v_bonus := 90; END IF;

      -- Get referrer's user_id and referred person's name
      SELECT user_id INTO v_referrer_user_id FROM profiles WHERE id = v_referral_row.referrer_id;
      SELECT full_name[1] INTO v_referred_name FROM profiles WHERE id = v_employee_profile_id;

      UPDATE profiles SET available_balance = available_balance + v_bonus WHERE id = v_referral_row.referrer_id;

      INSERT INTO transactions (profile_id, amount, type, description, reference_id)
      VALUES (v_referral_row.referrer_id, v_bonus, 'credit', 'Referral job completion bonus', v_referral_row.id);

      UPDATE referrals SET job_bonus_paid = true WHERE id = v_referral_row.id;

      -- Send notification to referrer
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        v_referrer_user_id,
        'Job Bonus Earned! 💰',
        COALESCE(v_referred_name, 'Your referral') || ' completed their first job! ₹' || v_bonus || ' has been credited to your wallet.',
        'info',
        'referral',
        v_referral_row.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
