-- Drop the generated column and recreate as a regular column
ALTER TABLE public.withdrawals DROP COLUMN order_id;
ALTER TABLE public.withdrawals ADD COLUMN order_id text;

-- Create a function that generates the order_id based on app_settings
CREATE OR REPLACE FUNCTION public.generate_withdrawal_order_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text := '';
  v_include_year boolean := false;
  v_include_month boolean := false;
  v_include_date boolean := true;
  v_digits int := 7;
  v_order_id text := '';
  v_setting record;
BEGIN
  FOR v_setting IN 
    SELECT key, value FROM app_settings 
    WHERE key IN ('withdrawal_order_id_prefix', 'withdrawal_order_id_include_year', 'withdrawal_order_id_include_month', 'withdrawal_order_id_include_date', 'withdrawal_order_id_length')
  LOOP
    CASE v_setting.key
      WHEN 'withdrawal_order_id_prefix' THEN v_prefix := COALESCE(v_setting.value, '');
      WHEN 'withdrawal_order_id_include_year' THEN v_include_year := (v_setting.value = 'true');
      WHEN 'withdrawal_order_id_include_month' THEN v_include_month := (v_setting.value = 'true');
      WHEN 'withdrawal_order_id_include_date' THEN v_include_date := (v_setting.value = 'true');
      WHEN 'withdrawal_order_id_length' THEN v_digits := GREATEST(COALESCE(v_setting.value::int, 7), 3);
    END CASE;
  END LOOP;

  IF v_prefix != '' THEN
    v_order_id := v_prefix || '-';
  END IF;

  IF v_include_date THEN
    v_order_id := v_order_id || to_char(NOW(), 'DD');
  END IF;

  IF v_include_month THEN
    v_order_id := v_order_id || to_char(NOW(), 'MM');
  END IF;

  IF v_include_year THEN
    v_order_id := v_order_id || to_char(NOW(), 'YY');
  END IF;

  v_order_id := v_order_id || lpad(NEW.order_number::text, v_digits, '0');

  NEW.order_id := v_order_id;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_generate_withdrawal_order_id ON public.withdrawals;
CREATE TRIGGER trg_generate_withdrawal_order_id
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_withdrawal_order_id();

-- Backfill existing rows
UPDATE public.withdrawals 
SET order_id = 'WDR-' || lpad(order_number::text, 7, '0')
WHERE order_id IS NULL;