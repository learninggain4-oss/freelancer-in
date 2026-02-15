-- Create the missing support chat room for existing pending recovery request
INSERT INTO public.chat_rooms (project_id, type, recovery_request_id)
VALUES ('9da2cbe7-6030-4cf9-9e3c-b711f17291d5', 'support', '836abbb4-602e-45d4-a3a1-1da1bce7f65b')
ON CONFLICT DO NOTHING;