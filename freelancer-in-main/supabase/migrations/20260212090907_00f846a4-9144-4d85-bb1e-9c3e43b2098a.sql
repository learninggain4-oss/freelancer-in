
-- Create a trigger function to auto-create a chat room when application is approved
CREATE OR REPLACE FUNCTION public.create_chat_room_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Create chat room if one doesn't already exist for this project
    INSERT INTO public.chat_rooms (project_id)
    SELECT NEW.project_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.chat_rooms WHERE project_id = NEW.project_id
    );

    -- Also assign the employee to the project
    UPDATE public.projects
    SET assigned_employee_id = NEW.employee_id,
        status = 'in_progress'
    WHERE id = NEW.project_id
      AND assigned_employee_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on project_applications
CREATE TRIGGER trg_create_chat_room_on_approval
AFTER UPDATE OF status ON public.project_applications
FOR EACH ROW
EXECUTE FUNCTION public.create_chat_room_on_approval();
