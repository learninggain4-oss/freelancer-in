
-- Fix 1: Restrict notifications INSERT to admins only (prevent notification spoofing)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Only admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Create the missing generate_user_code trigger
CREATE TRIGGER trigger_generate_user_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_code();
