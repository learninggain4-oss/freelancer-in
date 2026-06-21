
-- First fix duplicate order_ids by appending sequence suffix
UPDATE public.withdrawals SET order_id = order_id || '-1' WHERE id = '6bf9a565-eece-4423-8227-9a151e763474';
UPDATE public.withdrawals SET order_id = order_id || '-2' WHERE id = '4e8a85c3-642c-4b9c-88b0-a80f018679ba';
UPDATE public.withdrawals SET order_id = order_id || '-3' WHERE id = '1249fc62-b2e6-40b6-b6f7-8876ffeba6f3';
UPDATE public.withdrawals SET order_id = order_id || '-1' WHERE id = 'f5038718-72a4-4f3c-ad1a-73a620527aad';
UPDATE public.withdrawals SET order_id = order_id || '-2' WHERE id = '3a811f64-3565-40e1-a005-26b0c750c045';

-- Now create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_order_id_unique ON public.withdrawals (order_id) WHERE order_id IS NOT NULL;

-- Replace the trigger function with date-based sequence ensuring uniqueness
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
  v_base text := '';
  v_setting record;
  v_seq int;
  v_order_id text;
  v_attempts int := 0;
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
    v_base := v_prefix || '-';
  END IF;

  IF v_include_date THEN
    v_base := v_base || to_char(NOW(), 'DD');
  END IF;

  IF v_include_month THEN
    v_base := v_base || to_char(NOW(), 'MM');
  END IF;

  IF v_include_year THEN
    v_base := v_base || to_char(NOW(), 'YY');
  END IF;

  -- Count existing withdrawals with same base prefix to get next sequence
  SELECT COUNT(*) + 1
  INTO v_seq
  FROM withdrawals w
  WHERE w.order_id LIKE v_base || '%';

  v_order_id := v_base || lpad(v_seq::text, v_digits, '0');

  -- Safety loop: if the generated ID already exists, increment
  WHILE EXISTS (SELECT 1 FROM withdrawals WHERE order_id = v_order_id) LOOP
    v_seq := v_seq + 1;
    v_order_id := v_base || lpad(v_seq::text, v_digits, '0');
    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique withdrawal order ID after 100 attempts';
    END IF;
  END LOOP;

  NEW.order_id := v_order_id;
  RETURN NEW;
END;
$$;
