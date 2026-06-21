-- Create table to track coin rewards (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.coin_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, reward_type, reference_id)
);

-- Enable RLS
ALTER TABLE public.coin_reward_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own claims" ON public.coin_reward_claims
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage claims" ON public.coin_reward_claims
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anon access" ON public.coin_reward_claims
  FOR ALL USING (false) WITH CHECK (false);

-- 1. Trigger for Complete Profile
CREATE OR REPLACE FUNCTION public.award_coins_complete_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_reward integer;
  v_is_complete boolean;
BEGIN
  -- Check if profile is now complete (has required fields)
  v_is_complete := NEW.full_name IS NOT NULL AND array_length(NEW.full_name, 1) > 0
    AND NEW.gender IS NOT NULL
    AND NEW.date_of_birth IS NOT NULL
    AND NEW.mobile_number IS NOT NULL
    AND NEW.whatsapp_number IS NOT NULL;
  
  -- Only proceed if profile became complete and wasn't before
  IF v_is_complete AND (
    OLD.full_name IS NULL OR array_length(OLD.full_name, 1) = 0
    OR OLD.gender IS NULL
    OR OLD.date_of_birth IS NULL
    OR OLD.mobile_number IS NULL
    OR OLD.whatsapp_number IS NULL
  ) THEN
    -- Check if reward already claimed
    IF NOT EXISTS (SELECT 1 FROM coin_reward_claims WHERE profile_id = NEW.id AND reward_type = 'complete_profile') THEN
      -- Get reward amount
      SELECT COALESCE(value::integer, 1000) INTO v_reward FROM app_settings WHERE key = 'coin_reward_complete_profile';
      IF v_reward IS NULL THEN v_reward := 1000; END IF;
      
      -- Award coins
      UPDATE profiles SET coin_balance = coin_balance + v_reward WHERE id = NEW.id;
      
      -- Record claim
      INSERT INTO coin_reward_claims (profile_id, reward_type) VALUES (NEW.id, 'complete_profile');
      
      -- Record transaction
      INSERT INTO coin_transactions (profile_id, amount, type, description)
      VALUES (NEW.id, v_reward, 'credit', 'Completed profile');
      
      -- Send notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NEW.user_id, 'Coins Earned! 🎉', 'You earned ' || v_reward || ' coins for completing your profile!', 'info');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_award_coins_complete_profile
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_coins_complete_profile();

-- 2. Trigger for Complete Project (for employee)
CREATE OR REPLACE FUNCTION public.award_coins_complete_project()
RETURNS TRIGGER AS $$
DECLARE
  v_reward integer;
  v_employee_user_id uuid;
BEGIN
  -- Only when project status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') AND NEW.assigned_employee_id IS NOT NULL THEN
    -- Check if reward already claimed for this project
    IF NOT EXISTS (SELECT 1 FROM coin_reward_claims WHERE profile_id = NEW.assigned_employee_id AND reward_type = 'complete_project' AND reference_id = NEW.id) THEN
      -- Get reward amount
      SELECT COALESCE(value::integer, 2000) INTO v_reward FROM app_settings WHERE key = 'coin_reward_complete_project';
      IF v_reward IS NULL THEN v_reward := 2000; END IF;
      
      -- Get employee user_id
      SELECT user_id INTO v_employee_user_id FROM profiles WHERE id = NEW.assigned_employee_id;
      
      -- Award coins
      UPDATE profiles SET coin_balance = coin_balance + v_reward WHERE id = NEW.assigned_employee_id;
      
      -- Record claim
      INSERT INTO coin_reward_claims (profile_id, reward_type, reference_id) VALUES (NEW.assigned_employee_id, 'complete_project', NEW.id);
      
      -- Record transaction
      INSERT INTO coin_transactions (profile_id, amount, type, description)
      VALUES (NEW.assigned_employee_id, v_reward, 'credit', 'Completed project: ' || NEW.name);
      
      -- Send notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_employee_user_id, 'Coins Earned! 💰', 'You earned ' || v_reward || ' coins for completing "' || NEW.name || '"!', 'info');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_award_coins_complete_project
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION award_coins_complete_project();

-- 3. Trigger for Daily Attendance
CREATE OR REPLACE FUNCTION public.award_coins_daily_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_reward integer;
  v_user_id uuid;
BEGIN
  -- Only for new attendance records with 'present' status
  IF NEW.status = 'present' THEN
    -- Check if reward already claimed for this attendance date
    IF NOT EXISTS (SELECT 1 FROM coin_reward_claims WHERE profile_id = NEW.profile_id AND reward_type = 'daily_attendance' AND reference_id = NEW.id) THEN
      -- Get reward amount
      SELECT COALESCE(value::integer, 3000) INTO v_reward FROM app_settings WHERE key = 'coin_reward_daily_attendance';
      IF v_reward IS NULL THEN v_reward := 3000; END IF;
      
      -- Get user_id
      SELECT user_id INTO v_user_id FROM profiles WHERE id = NEW.profile_id;
      
      -- Award coins
      UPDATE profiles SET coin_balance = coin_balance + v_reward WHERE id = NEW.profile_id;
      
      -- Record claim
      INSERT INTO coin_reward_claims (profile_id, reward_type, reference_id) VALUES (NEW.profile_id, 'daily_attendance', NEW.id);
      
      -- Record transaction
      INSERT INTO coin_transactions (profile_id, amount, type, description)
      VALUES (NEW.profile_id, v_reward, 'credit', 'Daily attendance: ' || NEW.date);
      
      -- Send notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, 'Attendance Coins! 📅', 'You earned ' || v_reward || ' coins for marking attendance today!', 'info');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_award_coins_daily_attendance
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION award_coins_daily_attendance();

-- 4. Trigger for 5-Star Review
CREATE OR REPLACE FUNCTION public.award_coins_5star_review()
RETURNS TRIGGER AS $$
DECLARE
  v_reward integer;
  v_user_id uuid;
BEGIN
  -- Only for 5-star reviews
  IF NEW.rating = 5 THEN
    -- Check if reward already claimed for this review
    IF NOT EXISTS (SELECT 1 FROM coin_reward_claims WHERE profile_id = NEW.reviewee_id AND reward_type = '5star_review' AND reference_id = NEW.id) THEN
      -- Get reward amount
      SELECT COALESCE(value::integer, 3000) INTO v_reward FROM app_settings WHERE key = 'coin_reward_5star_review';
      IF v_reward IS NULL THEN v_reward := 3000; END IF;
      
      -- Get user_id
      SELECT user_id INTO v_user_id FROM profiles WHERE id = NEW.reviewee_id;
      
      -- Award coins
      UPDATE profiles SET coin_balance = coin_balance + v_reward WHERE id = NEW.reviewee_id;
      
      -- Record claim
      INSERT INTO coin_reward_claims (profile_id, reward_type, reference_id) VALUES (NEW.reviewee_id, '5star_review', NEW.id);
      
      -- Record transaction
      INSERT INTO coin_transactions (profile_id, amount, type, description)
      VALUES (NEW.reviewee_id, v_reward, 'credit', 'Received 5-star review');
      
      -- Send notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, '5-Star Review! ⭐', 'You earned ' || v_reward || ' coins for receiving a 5-star review!', 'info');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_award_coins_5star_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_coins_5star_review();

-- 5. Trigger for Refer 10 Friends
CREATE OR REPLACE FUNCTION public.award_coins_referral_10()
RETURNS TRIGGER AS $$
DECLARE
  v_reward integer;
  v_user_id uuid;
  v_referral_count integer;
BEGIN
  -- Count total referrals for the referrer
  SELECT COUNT(*) INTO v_referral_count FROM referrals WHERE referrer_id = NEW.referrer_id;
  
  -- Check if they hit 10 referrals
  IF v_referral_count >= 10 THEN
    -- Check if reward already claimed
    IF NOT EXISTS (SELECT 1 FROM coin_reward_claims WHERE profile_id = NEW.referrer_id AND reward_type = 'referral_10') THEN
      -- Get reward amount
      SELECT COALESCE(value::integer, 10000) INTO v_reward FROM app_settings WHERE key = 'coin_reward_referral_10';
      IF v_reward IS NULL THEN v_reward := 10000; END IF;
      
      -- Get user_id
      SELECT user_id INTO v_user_id FROM profiles WHERE id = NEW.referrer_id;
      
      -- Award coins
      UPDATE profiles SET coin_balance = coin_balance + v_reward WHERE id = NEW.referrer_id;
      
      -- Record claim
      INSERT INTO coin_reward_claims (profile_id, reward_type) VALUES (NEW.referrer_id, 'referral_10');
      
      -- Record transaction
      INSERT INTO coin_transactions (profile_id, amount, type, description)
      VALUES (NEW.referrer_id, v_reward, 'credit', 'Referred 10 friends milestone');
      
      -- Send notification
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (v_user_id, 'Referral Milestone! 🎊', 'You earned ' || v_reward || ' coins for referring 10 friends!', 'info');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_award_coins_referral_10
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION award_coins_referral_10();