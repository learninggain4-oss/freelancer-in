-- First fix the trigger function to handle array type for user_code
CREATE OR REPLACE FUNCTION public.generate_user_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.user_type = 'employee' THEN
    prefix := 'EMP';
  ELSE
    prefix := 'CLT';
  END IF;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(user_code[1] FROM 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.profiles
  WHERE user_type = NEW.user_type AND user_code IS NOT NULL;
  
  NEW.user_code := ARRAY[prefix || LPAD(seq_num::TEXT, 5, '0')];
  RETURN NEW;
END;
$function$;