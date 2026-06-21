
-- Insert default settings for date-based user codes
INSERT INTO app_settings (key, value) VALUES
  ('employee_code_include_year', 'false'),
  ('employee_code_include_month', 'false'),
  ('client_code_include_year', 'false'),
  ('client_code_include_month', 'false'),
  ('employee_code_separator', '-'),
  ('client_code_separator', '-')
ON CONFLICT (key) DO NOTHING;

-- Replace generate_user_code function with date-based support
CREATE OR REPLACE FUNCTION public.generate_user_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix TEXT;
  digits INTEGER;
  separator TEXT;
  include_year BOOLEAN;
  include_month BOOLEAN;
  seq_num INTEGER;
  year_part TEXT;
  month_part TEXT;
  code_body TEXT;
  pattern TEXT;
BEGIN
  IF NEW.user_type = 'employee' THEN
    SELECT value INTO prefix FROM app_settings WHERE key = 'employee_code_prefix';
    SELECT value::integer INTO digits FROM app_settings WHERE key = 'employee_code_digits';
    SELECT value INTO separator FROM app_settings WHERE key = 'employee_code_separator';
    SELECT COALESCE(value, 'false') = 'true' INTO include_year FROM app_settings WHERE key = 'employee_code_include_year';
    SELECT COALESCE(value, 'false') = 'true' INTO include_month FROM app_settings WHERE key = 'employee_code_include_month';
  ELSE
    SELECT value INTO prefix FROM app_settings WHERE key = 'client_code_prefix';
    SELECT value::integer INTO digits FROM app_settings WHERE key = 'client_code_digits';
    SELECT value INTO separator FROM app_settings WHERE key = 'client_code_separator';
    SELECT COALESCE(value, 'false') = 'true' INTO include_year FROM app_settings WHERE key = 'client_code_include_year';
    SELECT COALESCE(value, 'false') = 'true' INTO include_month FROM app_settings WHERE key = 'client_code_include_month';
  END IF;

  -- Fallback defaults
  IF prefix IS NULL THEN prefix := CASE WHEN NEW.user_type = 'employee' THEN 'EMP' ELSE 'CLT' END; END IF;
  IF digits IS NULL OR digits < 1 THEN digits := 5; END IF;
  IF separator IS NULL THEN separator := '-'; END IF;
  IF include_year IS NULL THEN include_year := false; END IF;
  IF include_month IS NULL THEN include_month := false; END IF;

  -- Build date parts
  year_part := EXTRACT(YEAR FROM now())::TEXT;
  month_part := LPAD(EXTRACT(MONTH FROM now())::INTEGER::TEXT, 2, '0');

  -- Build the code body (prefix + separator + date parts)
  code_body := prefix;
  IF include_year THEN
    code_body := code_body || separator || year_part;
    IF include_month THEN
      code_body := code_body || separator || month_part;
    END IF;
  END IF;

  -- Build regex pattern to match existing codes with same prefix+date combo
  -- We escape the code_body for regex and look for trailing digits
  pattern := '^' || regexp_replace(code_body, '([.\-/])', '\\\1', 'g') || CASE WHEN include_year THEN regexp_replace(separator, '([.\-/])', '\\\1', 'g') ELSE '' END;

  -- Get next sequential number
  -- Count only codes matching the same prefix+date pattern
  IF include_year THEN
    SELECT COALESCE(MAX(
      CAST(
        REGEXP_REPLACE(user_code[1], '.*[^0-9]', '', 'g') AS INTEGER
      )
    ), 0) + 1
    INTO seq_num
    FROM public.profiles
    WHERE user_type = NEW.user_type
      AND user_code IS NOT NULL
      AND array_length(user_code, 1) > 0
      AND user_code[1] LIKE code_body || '%';
  ELSE
    SELECT COALESCE(MAX(
      CAST(REGEXP_REPLACE(user_code[1], '[^0-9]', '', 'g') AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM public.profiles
    WHERE user_type = NEW.user_type AND user_code IS NOT NULL AND array_length(user_code, 1) > 0;
  END IF;

  -- Build final code
  IF include_year THEN
    NEW.user_code := ARRAY[code_body || separator || LPAD(seq_num::TEXT, digits, '0')];
  ELSE
    NEW.user_code := ARRAY[prefix || LPAD(seq_num::TEXT, digits, '0')];
  END IF;

  RETURN NEW;
END;
$function$;
