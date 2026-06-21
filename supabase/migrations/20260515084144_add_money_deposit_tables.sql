-- Add Money: deposit_requests and add_money_queue tables

CREATE TABLE IF NOT EXISTS deposit_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 100 AND amount <= 50000),
  payment_method text NOT NULL DEFAULT 'UPI',
  payment_details jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  order_id text UNIQUE DEFAULT ('DEP-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  review_notes text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deposit_requests_profile_id_idx ON deposit_requests(profile_id);
CREATE INDEX IF NOT EXISTS deposit_requests_status_idx ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS deposit_requests_created_at_idx ON deposit_requests(created_at DESC);

ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage deposit_requests" ON deposit_requests
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'admin'));
CREATE POLICY "Users can view own deposit_requests" ON deposit_requests
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS add_money_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired'))
);

CREATE INDEX IF NOT EXISTS add_money_queue_status_expires_idx ON add_money_queue(status, expires_at);

ALTER TABLE add_money_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages add_money_queue" ON add_money_queue USING (true) WITH CHECK (true);
