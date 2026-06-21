-- Add new project statuses for 4-step validation flow
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'job_confirmed' AFTER 'in_progress';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'validation' AFTER 'payment_processing';