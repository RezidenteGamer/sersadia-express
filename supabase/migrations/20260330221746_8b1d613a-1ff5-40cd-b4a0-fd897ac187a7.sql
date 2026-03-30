
-- Function to notify admins when a receipt is uploaded
CREATE OR REPLACE FUNCTION public.notify_admin_on_receipt_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  reservation_record RECORD;
  user_profile RECORD;
BEGIN
  -- Only trigger when receipt_url changes from NULL to a value
  IF OLD.receipt_url IS NULL AND NEW.receipt_url IS NOT NULL THEN
    -- Get reservation info
    SELECT r.code, r.user_id, l.name as location_name
    INTO reservation_record
    FROM reservations r
    JOIN locations l ON l.id = r.location_id
    WHERE r.id = NEW.reservation_id;

    -- Get user name
    SELECT full_name INTO user_profile
    FROM profiles
    WHERE id = reservation_record.user_id;

    -- Notify all admins
    FOR admin_record IN
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message)
      VALUES (
        admin_record.user_id,
        'Comprovante PIX recebido',
        'O usuário ' || COALESCE(user_profile.full_name, 'Desconhecido') || ' enviou o comprovante de pagamento da reserva ' || reservation_record.code || ' (' || COALESCE(reservation_record.location_name, '') || '). Verifique e confirme o pagamento.'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on payments table
CREATE TRIGGER on_receipt_uploaded
  AFTER UPDATE OF receipt_url ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_receipt_upload();
