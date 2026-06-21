-- =============================================
-- Add transaction_id (13-digit) and status to transactions table
-- =============================================

-- Add transaction_id column (13-digit unique ID)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(13) UNIQUE;

-- Add status column for tracking transaction state
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'success';

-- Create index for faster lookups by transaction_id
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON public.transactions(transaction_id);

-- Create index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- =============================================
-- Update existing transactions with generated transaction_ids
-- =============================================

DO $$
DECLARE
  rec RECORD;
  new_txn_id VARCHAR(13);
  counter INTEGER := 0;
BEGIN
  -- Update existing records that don't have transaction_id
  FOR rec IN 
    SELECT id, created_at 
    FROM public.transactions 
    WHERE transaction_id IS NULL 
    ORDER BY created_at ASC
  LOOP
    -- Generate TXN-YYMMDD-XXXXXX format
    new_txn_id := 'TXN' || 
      TO_CHAR(rec.created_at, 'YYMMDD') || 
      LPAD((EXTRACT(EPOCH FROM rec.created_at)::INTEGER + counter)::TEXT, 6, '0');
    
    UPDATE public.transactions 
    SET transaction_id = new_txn_id 
    WHERE id = rec.id;
    
    counter := counter + 1;
  END LOOP;
END $$;
