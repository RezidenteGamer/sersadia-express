
-- Auto-confirm reservation when payment is marked as paid
CREATE OR REPLACE FUNCTION public.auto_confirm_reservation_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when is_paid changes from false to true
  IF OLD.is_paid = false AND NEW.is_paid = true THEN
    UPDATE public.reservations
    SET status = 'confirmed', updated_at = now()
    WHERE id = NEW.reservation_id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_confirm_on_payment
  AFTER UPDATE OF is_paid ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_reservation_on_payment();
