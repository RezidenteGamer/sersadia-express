
-- Trigger: notify user when reservation status changes to confirmed, rejected, cancelled_by_admin
CREATE OR REPLACE FUNCTION public.notify_user_on_reservation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  location_name TEXT;
  notif_title TEXT;
  notif_message TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get location name
  SELECT name INTO location_name FROM public.locations WHERE id = NEW.location_id;

  IF NEW.status = 'confirmed' THEN
    notif_title := 'Reserva aprovada! ✅';
    notif_message := 'Sua reserva ' || NEW.code || ' para ' || COALESCE(location_name, 'o local') || ' em ' || to_char(NEW.reservation_date, 'DD/MM/YYYY') || ' foi aprovada. Apresente o código ' || NEW.code || ' no check-in.';
  ELSIF NEW.status = 'rejected' THEN
    notif_title := 'Reserva recusada ❌';
    notif_message := 'Sua reserva ' || NEW.code || ' para ' || COALESCE(location_name, 'o local') || ' em ' || to_char(NEW.reservation_date, 'DD/MM/YYYY') || ' foi recusada.';
    IF NEW.admin_notes IS NOT NULL AND NEW.admin_notes <> '' THEN
      notif_message := notif_message || ' Motivo: ' || NEW.admin_notes;
    END IF;
  ELSIF NEW.status = 'cancelled_by_admin' THEN
    notif_title := 'Reserva cancelada pelo administrador';
    notif_message := 'Sua reserva ' || NEW.code || ' para ' || COALESCE(location_name, 'o local') || ' em ' || to_char(NEW.reservation_date, 'DD/MM/YYYY') || ' foi cancelada pela administração.';
    IF NEW.admin_notes IS NOT NULL AND NEW.admin_notes <> '' THEN
      notif_message := notif_message || ' Motivo: ' || NEW.admin_notes;
    END IF;
  ELSIF NEW.status = 'presence_confirmed' THEN
    notif_title := 'Presença confirmada! 🎉';
    notif_message := 'Sua presença na reserva ' || NEW.code || ' (' || COALESCE(location_name, '') || ') foi registrada. Aproveite!';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (NEW.user_id, notif_title, notif_message);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_on_reservation_status_change
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_reservation_status_change();
