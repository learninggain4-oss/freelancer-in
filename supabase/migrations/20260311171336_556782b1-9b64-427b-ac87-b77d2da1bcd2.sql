
-- Create a function that sends OneSignal push notifications via pg_net
-- This will be called by triggers on key database events
CREATE OR REPLACE FUNCTION public.send_onesignal_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url text;
  v_project_id text;
BEGIN
  -- Call the edge function to send push notification
  -- The edge function URL is constructed from the project ref
  v_project_id := 'maysttckdfnnzvfeujaj';
  v_url := 'https://' || v_project_id || '.supabase.co/functions/v1/send-onesignal';
  
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: send OneSignal push on notification insert
DROP TRIGGER IF EXISTS trigger_onesignal_push ON notifications;
CREATE TRIGGER trigger_onesignal_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_onesignal_push();
