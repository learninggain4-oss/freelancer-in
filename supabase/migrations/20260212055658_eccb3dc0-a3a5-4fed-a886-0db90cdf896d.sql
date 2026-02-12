INSERT INTO profiles (id, user_id, user_type, full_name, user_code, email, approval_status)
VALUES (gen_random_uuid(), '27fbe787-6dc5-4bf0-b794-46381fe39b39', 'employee', ARRAY['Mihraj Punnad'], ARRAY['EMP00001'], 'mihrajpunnad27@gmail.com', 'approved')
ON CONFLICT (user_id) DO NOTHING;