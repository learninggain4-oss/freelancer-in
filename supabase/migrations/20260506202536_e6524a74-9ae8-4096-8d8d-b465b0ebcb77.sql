CREATE OR REPLACE FUNCTION public.lookup_email_by_mobile_dob(p_mobile text, p_dob date)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_local text;
  v_domain text;
  v_masked text;
BEGIN
  IF p_mobile IS NULL OR p_dob IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM profiles
  WHERE (mobile_number = p_mobile OR whatsapp_number = p_mobile)
    AND date_of_birth = p_dob
  LIMIT 1;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  v_local := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  IF length(v_local) <= 2 THEN
    v_masked := left(v_local, 1) || repeat('*', greatest(length(v_local) - 1, 1));
  ELSE
    v_masked := left(v_local, 2) || repeat('*', length(v_local) - 2);
  END IF;

  RETURN v_masked || '@' || v_domain;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_email_by_mobile_dob(text, date) TO anon, authenticated;