
INSERT INTO public.upgrade_chat_time_slots (start_hour, start_minute, end_hour, end_minute, label, display_order, is_enabled, day_of_week)
SELECT h, 0, h+1, 0,
  '🕐 ' || 
  CASE WHEN h = 0 THEN '12' WHEN h > 12 THEN (h-12)::text ELSE h::text END || 
  ':00 ' || 
  CASE WHEN h < 12 THEN 'AM' ELSE 'PM' END || 
  ' - ' || 
  CASE WHEN (h+1) = 0 THEN '12' WHEN (h+1) > 12 THEN ((h+1)-12)::text ELSE (h+1)::text END || 
  ':00 ' || 
  CASE WHEN (h+1) < 12 THEN 'AM' ELSE 'PM' END,
  (h - 9 + 1),
  true,
  d
FROM generate_series(9, 17) AS h
CROSS JOIN generate_series(0, 6) AS d;
