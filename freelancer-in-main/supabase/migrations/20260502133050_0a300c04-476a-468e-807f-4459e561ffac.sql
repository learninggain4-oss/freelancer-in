-- Add transaction_id and status columns to transactions table for unified TXN tracking
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'success';

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_transaction_id ON public.transactions(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Allow profile owner to insert their own failed transactions (for client-side failure logging)
DO $$ BEGIN
  CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;