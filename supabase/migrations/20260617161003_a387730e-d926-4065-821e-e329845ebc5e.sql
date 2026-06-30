
-- Allow owners to UPDATE their own bank account rows
CREATE POLICY "Users can update own bank accounts"
ON public.user_bank_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_bank_accounts.profile_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_bank_accounts.profile_id AND p.user_id = auth.uid()
  )
);

-- Trigger: keep locked bank fields immutable for non-admin users; only linked_upi_app_id is modifiable.
CREATE OR REPLACE FUNCTION public.protect_locked_bank_account_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.is_locked = true THEN
    IF NEW.bank_name IS DISTINCT FROM OLD.bank_name
       OR NEW.bank_holder_name IS DISTINCT FROM OLD.bank_holder_name
       OR NEW.bank_account_number IS DISTINCT FROM OLD.bank_account_number
       OR NEW.bank_ifsc_code IS DISTINCT FROM OLD.bank_ifsc_code
       OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
       OR NEW.is_locked IS DISTINCT FROM OLD.is_locked THEN
      RAISE EXCEPTION 'Bank account is locked. Contact admin to modify these details.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_locked_bank_account_fields ON public.user_bank_accounts;
CREATE TRIGGER trg_protect_locked_bank_account_fields
BEFORE UPDATE ON public.user_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.protect_locked_bank_account_fields();
