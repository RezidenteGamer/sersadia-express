
-- 1. Partial unique index to prevent race conditions on reservations
-- Only enforces uniqueness for active reservations (not cancelled/expired/rejected)
CREATE UNIQUE INDEX idx_unique_active_reservation 
ON public.reservations (location_id, reservation_date, start_time, end_time)
WHERE status IN ('pending', 'confirmed', 'presence_confirmed');

-- 2. Add expiration column to track when pending reservations should expire
ALTER TABLE public.reservations 
ADD COLUMN expires_at timestamp with time zone;

-- 3. Set default expiration: 30 minutes from creation for pending reservations
-- (existing pending reservations will get NULL, which the cron will handle)
COMMENT ON COLUMN public.reservations.expires_at IS 'When a pending reservation should auto-expire if not paid';

-- 4. Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 5. Create function to expire old pending reservations
CREATE OR REPLACE FUNCTION public.expire_pending_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
BEGIN
  WITH expired AS (
    UPDATE public.reservations
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending'
    AND (
      -- Expire if expires_at is set and passed
      (expires_at IS NOT NULL AND expires_at < now())
      -- Or if no expires_at but created more than 30 minutes ago
      OR (expires_at IS NULL AND created_at < now() - interval '30 minutes')
    )
    -- Don't expire if already paid
    AND NOT EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.reservation_id = reservations.id AND p.is_paid = true
    )
    RETURNING id, user_id, code
  )
  SELECT count(*) INTO expired_count FROM expired;
  
  -- Create notifications for expired reservations
  INSERT INTO public.notifications (user_id, title, message)
  SELECT 
    user_id,
    'Reserva expirada',
    'Sua reserva ' || code || ' expirou por falta de pagamento. Você pode fazer uma nova reserva.'
  FROM (
    SELECT user_id, code FROM public.reservations
    WHERE status = 'expired' 
    AND updated_at >= now() - interval '1 minute'
  ) recently_expired;
  
  RETURN expired_count;
END;
$$;
