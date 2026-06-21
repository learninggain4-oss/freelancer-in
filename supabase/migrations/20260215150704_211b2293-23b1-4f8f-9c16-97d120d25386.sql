
-- Add is_cleared column for soft delete to all relevant tables
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;
ALTER TABLE public.recovery_requests ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;
ALTER TABLE public.aadhaar_verifications ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;
ALTER TABLE public.bank_verifications ADD COLUMN IF NOT EXISTS is_cleared boolean NOT NULL DEFAULT false;

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_projects_is_cleared ON public.projects(is_cleared);
CREATE INDEX IF NOT EXISTS idx_recovery_requests_is_cleared ON public.recovery_requests(is_cleared);
CREATE INDEX IF NOT EXISTS idx_withdrawals_is_cleared ON public.withdrawals(is_cleared);
CREATE INDEX IF NOT EXISTS idx_transactions_is_cleared ON public.transactions(is_cleared);
CREATE INDEX IF NOT EXISTS idx_notifications_is_cleared ON public.notifications(is_cleared);
CREATE INDEX IF NOT EXISTS idx_aadhaar_verifications_is_cleared ON public.aadhaar_verifications(is_cleared);
CREATE INDEX IF NOT EXISTS idx_bank_verifications_is_cleared ON public.bank_verifications(is_cleared);
