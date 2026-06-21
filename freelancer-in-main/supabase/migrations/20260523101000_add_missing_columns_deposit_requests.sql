-- Comprehensive migration to ensure deposit_requests table has all required columns

-- First, check if table exists and create if needed (should already exist)
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  status TEXT NOT NULL DEFAULT 'pending',
  order_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Now add all the missing columns
ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS admin_payment_details JSONB;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS utr_number TEXT;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS utr_submitted_at TIMESTAMPTZ;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS utr_deadline TIMESTAMPTZ;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS review_note TEXT;

ALTER TABLE public.deposit_requests
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update status constraint to allow all needed statuses
ALTER TABLE public.deposit_requests DROP CONSTRAINT IF EXISTS deposit_requests_status_check;

ALTER TABLE public.deposit_requests
ADD CONSTRAINT deposit_requests_status_check 
CHECK (status IN ('pending','payment_shared','utr_submitted','approved','rejected','expired'));

-- Ensure RLS is enabled
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DROP POLICY IF EXISTS "Users can view own deposit_requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create deposit_requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can update own deposit_requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can manage all deposit_requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can insert own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can manage deposit requests" ON public.deposit_requests;

-- Create comprehensive policies
CREATE POLICY "Users can view own deposit_requests"
  ON public.deposit_requests FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own deposit_requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own deposit_requests"
  ON public.deposit_requests FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all deposit_requests"
  ON public.deposit_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
  );

-- Create helpful indexes
DROP INDEX IF EXISTS idx_deposit_requests_profile_id;
CREATE INDEX idx_deposit_requests_profile_id ON public.deposit_requests(profile_id);

DROP INDEX IF EXISTS idx_deposit_requests_status;
CREATE INDEX idx_deposit_requests_status ON public.deposit_requests(status);

DROP INDEX IF EXISTS idx_deposit_requests_created_at;
CREATE INDEX idx_deposit_requests_created_at ON public.deposit_requests(created_at DESC);

DROP INDEX IF EXISTS idx_deposit_requests_payment_deadline;
CREATE INDEX idx_deposit_requests_payment_deadline ON public.deposit_requests(payment_deadline) 
WHERE status = 'payment_shared';

-- Set REPLICA IDENTITY for real-time subscriptions
ALTER TABLE public.deposit_requests REPLICA IDENTITY FULL;

