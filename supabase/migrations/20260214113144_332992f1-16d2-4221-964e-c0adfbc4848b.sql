
-- Function: Credit signup bonus when referred user is approved
CREATE OR REPLACE FUNCTION public.credit_referral_signup_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_bonus numeric;
  v_referral_id uuid;
BEGIN
  -- Only act when approval_status changes to 'approved'
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status <> 'approved') THEN
    -- Check if this user was referred
    IF NEW.referred_by IS NOT NULL AND NEW.referred_by <> '' THEN
      -- Find the referrer by referral_code
      SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = NEW.referred_by LIMIT 1;
      
      IF v_referrer_id IS NOT NULL AND v_referrer_id <> NEW.id THEN
        -- Create referral record if not exists
        INSERT INTO referrals (referrer_id, referred_id)
        VALUES (v_referrer_id, NEW.id)
        ON CONFLICT (referred_id) DO NOTHING;

        -- Get the referral row
        SELECT id INTO v_referral_id FROM referrals WHERE referred_id = NEW.id AND referrer_id = v_referrer_id AND signup_bonus_paid = false;

        IF v_referral_id IS NOT NULL THEN
          -- Get bonus amount from settings
          SELECT COALESCE(value::numeric, 10) INTO v_bonus FROM app_settings WHERE key = 'referral_signup_bonus';
          IF v_bonus IS NULL THEN v_bonus := 10; END IF;

          -- Credit referrer
          UPDATE profiles SET available_balance = available_balance + v_bonus WHERE id = v_referrer_id;

          -- Record transaction
          INSERT INTO transactions (profile_id, amount, type, description, reference_id)
          VALUES (v_referrer_id, v_bonus, 'credit', 'Referral signup bonus for ' || NEW.full_name[1], v_referral_id);

          -- Mark as paid
          UPDATE referrals SET signup_bonus_paid = true WHERE id = v_referral_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_referral_signup_bonus
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.credit_referral_signup_bonus();

-- Function: Credit job bonus when referred user's first project is completed
CREATE OR REPLACE FUNCTION public.credit_referral_job_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_profile_id uuid;
  v_referral_row record;
  v_bonus numeric;
BEGIN
  -- Only act when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') AND NEW.assigned_employee_id IS NOT NULL THEN
    v_employee_profile_id := NEW.assigned_employee_id;

    -- Check if this employee has an unpaid job referral bonus
    SELECT r.id, r.referrer_id INTO v_referral_row
    FROM referrals r
    WHERE r.referred_id = v_employee_profile_id AND r.job_bonus_paid = false
    LIMIT 1;

    IF v_referral_row IS NOT NULL THEN
      -- Get bonus amount
      SELECT COALESCE(value::numeric, 90) INTO v_bonus FROM app_settings WHERE key = 'referral_job_bonus';
      IF v_bonus IS NULL THEN v_bonus := 90; END IF;

      -- Credit referrer
      UPDATE profiles SET available_balance = available_balance + v_bonus WHERE id = v_referral_row.referrer_id;

      -- Record transaction
      INSERT INTO transactions (profile_id, amount, type, description, reference_id)
      VALUES (v_referral_row.referrer_id, v_bonus, 'credit', 'Referral job completion bonus', v_referral_row.id);

      -- Mark as paid
      UPDATE referrals SET job_bonus_paid = true WHERE id = v_referral_row.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_referral_job_bonus
AFTER UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.credit_referral_job_bonus();
