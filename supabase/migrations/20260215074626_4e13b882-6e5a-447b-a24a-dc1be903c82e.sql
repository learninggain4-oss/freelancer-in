
-- Schedule cron job to auto-publish draft jobs every minute
SELECT cron.schedule(
  'auto-publish-scheduled-jobs',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://maysttckdfnnzvfeujaj.supabase.co/functions/v1/auto-publish-jobs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heXN0dGNrZGZubnp2ZmV1amFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTg1NTksImV4cCI6MjA4NjI3NDU1OX0.tIawlM0-rePDtGD-EKT1klugKYZvaEnJPlQ-emmwxTo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
