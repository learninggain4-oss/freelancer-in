
-- Add default code configuration settings
INSERT INTO app_settings (key, value) VALUES
  ('employee_code_prefix', 'EMP'),
  ('client_code_prefix', 'CLT'),
  ('employee_code_digits', '5'),
  ('client_code_digits', '5')
ON CONFLICT (key) DO NOTHING;

-- Update generate_user_code to read from app_settings
CREATE OR REPLACE FUNCTION public.generate_user_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix TEXT;
  digits INTEGER;
  seq_num INTEGER;
BEGIN
  IF NEW.user_type = 'employee' THEN
    SELECT value INTO prefix FROM app_settings WHERE key = 'employee_code_prefix';
    SELECT value::integer INTO digits FROM app_settings WHERE key = 'employee_code_digits';
  ELSE
    SELECT value INTO prefix FROM app_settings WHERE key = 'client_code_prefix';
    SELECT value::integer INTO digits FROM app_settings WHERE key = 'client_code_digits';
  END IF;

  -- Fallback defaults
  IF prefix IS NULL THEN prefix := CASE WHEN NEW.user_type = 'employee' THEN 'EMP' ELSE 'CLT' END; END IF;
  IF digits IS NULL OR digits < 1 THEN digits := 5; END IF;

  SELECT COALESCE(MAX(
    CAST(REGEXP_REPLACE(user_code[1], '[^0-9]', '', 'g') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.profiles
  WHERE user_type = NEW.user_type AND user_code IS NOT NULL AND array_length(user_code, 1) > 0;

  NEW.user_code := ARRAY[prefix || LPAD(seq_num::TEXT, digits, '0')];
  RETURN NEW;
END;
$function$;
