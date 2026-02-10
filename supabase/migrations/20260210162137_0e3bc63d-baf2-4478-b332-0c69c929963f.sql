
-- Add mercado_pago payment ID to payments table for refund support
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mp_payment_id text;

-- Add notification_url support: allow the webhook to update payments and reservations
-- The webhook will use the service role key, so no extra RLS needed
