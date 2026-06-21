-- Insert default coin reward settings
INSERT INTO app_settings (key, value) VALUES 
  ('coin_reward_complete_profile', '1000'),
  ('coin_reward_complete_project', '2000'),
  ('coin_reward_daily_attendance', '3000'),
  ('coin_reward_5star_review', '3000'),
  ('coin_reward_referral_10', '10000')
ON CONFLICT (key) DO NOTHING;