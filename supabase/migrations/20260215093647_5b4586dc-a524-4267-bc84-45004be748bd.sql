-- Insert the missing support chat room for the existing recovery request
INSERT INTO chat_rooms (project_id, type, recovery_request_id) 
VALUES ('f18cc2ff-a996-4fe2-b666-103e83ceeee3', 'support', '4d6b01fb-93cf-4799-ab52-25cf8ad4bba6')
ON CONFLICT DO NOTHING;