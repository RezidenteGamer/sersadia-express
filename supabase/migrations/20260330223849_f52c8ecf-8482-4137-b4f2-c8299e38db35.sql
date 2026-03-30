
-- Add refund-related columns to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_pix_key text,
  ADD COLUMN IF NOT EXISTS refund_pix_name text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
