
-- Attach the generate_user_code trigger to profiles
CREATE TRIGGER set_user_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_code();
