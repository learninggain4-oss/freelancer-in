-- Create the duplicate check function (without unique constraints since there's existing duplicate data)
CREATE OR REPLACE FUNCTION public.check_registration_duplicates(
  p_email text,
  p_mobile text,
  p_whatsapp text,
  p_full_name text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    result := result || '{"email": "This email is already registered"}'::jsonb;
  END IF;
  IF p_mobile IS NOT NULL AND p_mobile != '' AND EXISTS (SELECT 1 FROM profiles WHERE mobile_number = p_mobile) THEN
    result := result || '{"mobile_number": "This mobile number is already registered"}'::jsonb;
  END IF;
  IF p_whatsapp IS NOT NULL AND p_whatsapp != '' AND EXISTS (SELECT 1 FROM profiles WHERE whatsapp_number = p_whatsapp) THEN
    result := result || '{"whatsapp_number": "This WhatsApp number is already registered"}'::jsonb;
  END IF;
  IF p_full_name IS NOT NULL AND p_full_name != '' AND EXISTS (SELECT 1 FROM profiles WHERE p_full_name = ANY(full_name)) THEN
    result := result || '{"full_name": "This name is already registered"}'::jsonb;
  END IF;
  RETURN result;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.check_registration_duplicates TO anon, authenticated;