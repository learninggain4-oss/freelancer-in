-- Create deposit_requests table for manual payment flow
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','payment_shared','utr_submitted','approved','rejected','expired')),
  admin_payment_details JSONB,
  payment_deadline TIMESTAMPTZ,
  utr_number TEXT,
  utr_submitted_at TIMESTAMPTZ,
  utr_deadline TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposit_requests"
  ON public.deposit_requests FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create deposit_requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own deposit_requests"
  ON public.deposit_requests FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all deposit_requests"
  ON public.deposit_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

ALTER TABLE public.deposit_requests REPLICA IDENTITY FULL;
