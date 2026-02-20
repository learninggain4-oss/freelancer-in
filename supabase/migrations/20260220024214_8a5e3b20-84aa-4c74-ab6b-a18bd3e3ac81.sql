
CREATE OR REPLACE FUNCTION public.notify_payment_confirmation_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_user_id uuid;
  v_client_user_id uuid;
  v_project_name text;
BEGIN
  -- Get project name and user IDs
  SELECT p.name, emp.user_id, cli.user_id
  INTO v_project_name, v_employee_user_id, v_client_user_id
  FROM projects proj
  JOIN profiles emp ON emp.id = NEW.employee_id
  JOIN profiles cli ON cli.id = proj.client_id
  WHERE proj.id = NEW.project_id;

  -- 1) Client initiates payment confirmation (INSERT)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_employee_user_id,
      'Payment Confirmation Received 💳',
      'Client has shared a payment confirmation of ₹' || NEW.amount || ' for project "' || COALESCE(v_project_name, 'Unknown') || '". Please enter the OTP.',
      'info',
      'payment_confirmation',
      NEW.id
    );
  END IF;

  -- 2) Employee submits OTP (UPDATE: otp changes from null to a value)
  IF TG_OP = 'UPDATE' AND OLD.otp IS NULL AND NEW.otp IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_client_user_id,
      'OTP Submitted ✅',
      'Employee has submitted the OTP for payment confirmation of ₹' || NEW.amount || ' on project "' || COALESCE(v_project_name, 'Unknown') || '". Please verify.',
      'info',
      'payment_confirmation',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payment_confirmation
AFTER INSERT OR UPDATE ON public.payment_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_confirmation_events();
