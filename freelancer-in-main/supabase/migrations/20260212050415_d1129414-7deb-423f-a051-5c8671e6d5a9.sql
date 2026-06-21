-- Revoke SELECT on sensitive banking columns from client-accessible roles
-- Service role retains full access for edge function operations
REVOKE SELECT (bank_account_number, bank_ifsc_code, upi_id) ON public.withdrawals FROM authenticated;
REVOKE SELECT (bank_account_number, bank_ifsc_code, upi_id) ON public.withdrawals FROM anon;

-- Also revoke on profiles to prevent any future policy changes from exposing banking data
REVOKE SELECT (bank_account_number, bank_ifsc_code, upi_id) ON public.profiles FROM anon;