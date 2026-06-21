CREATE OR REPLACE FUNCTION public.generate_withdrawal_order_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prefix text := '';
  v_include_year boolean := false;
  v_include_month boolean := false;
  v_include_date boolean := true;
  v_digits int := 7;
  v_base text := '';
  v_setting record;
  v_order_id text;
  v_attempts int := 0;
  v_max bigint;
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

  -- Generate a random numeric suffix of v_digits length; retry on collision
  v_max := power(10::numeric, v_digits)::bigint;
  LOOP
    v_order_id := v_base || lpad(floor(random() * v_max)::bigint::text, v_digits, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM withdrawals WHERE order_id = v_order_id);
    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique withdrawal order ID after 100 attempts';
    END IF;
  END LOOP;

  NEW.order_id := v_order_id;
  RETURN NEW;
END;
$function$;