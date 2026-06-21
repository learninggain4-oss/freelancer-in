
-- Auto-create a support chat room whenever a recovery request is inserted
CREATE OR REPLACE FUNCTION public.create_support_chat_on_recovery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.chat_rooms (project_id, type, recovery_request_id)
  VALUES (NEW.project_id, 'support', NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_support_chat_on_recovery
AFTER INSERT ON public.recovery_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_support_chat_on_recovery();
