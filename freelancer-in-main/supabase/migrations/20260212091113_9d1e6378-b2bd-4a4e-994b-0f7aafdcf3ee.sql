
-- Fix the existing approved application: create chat room and assign employee
INSERT INTO public.chat_rooms (project_id)
VALUES ('c9f07dac-fce9-4117-9121-62406dccadfc')
ON CONFLICT DO NOTHING;

UPDATE public.projects
SET assigned_employee_id = '6d8888e5-b96e-4a05-b2fd-7118da8fdfbe',
    status = 'in_progress'
WHERE id = 'c9f07dac-fce9-4117-9121-62406dccadfc';
