-- Trigger functions are invoked by PostgreSQL, not directly by API clients.
-- Supabase projects may grant EXECUTE to anon/authenticated by default.
REVOKE EXECUTE ON FUNCTION public.check_reservation_periods() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_reservation_payment() FROM anon, authenticated;
