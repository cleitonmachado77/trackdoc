-- Dropar a view existente
DROP VIEW IF EXISTS public.notification_feed;

-- Recriar a view com a definição correta
CREATE VIEW public.notification_feed AS
SELECT 
  id,
  created_by as user_id,
  title,
  message,
  type,
  CASE 
    WHEN status = 'read' THEN true 
    ELSE false 
  END as is_read,
  recipients,
  status,
  priority,
  channels,
  created_at,
  updated_at,
  sent_at,
  scheduled_for,
  created_by,
  read_count,
  total_recipients,
  'notifications' as source
FROM public.notifications;