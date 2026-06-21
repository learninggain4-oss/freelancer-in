-- Add payment_processing to project_status enum
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'payment_processing' AFTER 'in_progress';
