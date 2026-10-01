-- One reservation and one payment may cover several configured periods.
-- Older reservations keep using start_time/end_time as their single period.
ALTER TABLE public.reservations
  ADD COLUMN time_slots jsonb;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_time_slots_valid CHECK (
    CASE
      WHEN time_slots IS NULL THEN true
      WHEN jsonb_typeof(time_slots) = 'array' THEN jsonb_array_length(time_slots) > 0
      ELSE false
    END
  );

-- Availability is public, but reservation owner/payment details remain behind RLS.
CREATE FUNCTION public.get_location_booked_slots(_location_id uuid, _date date)
RETURNS TABLE(start_time time, end_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (slot.value->>'start')::time, (slot.value->>'end')::time
  FROM public.reservations r
  CROSS JOIN LATERAL jsonb_array_elements(
    COALESCE(r.time_slots, jsonb_build_array(jsonb_build_object(
      'start', to_char(r.start_time, 'HH24:MI'),
      'end', to_char(r.end_time, 'HH24:MI')
    )))
  ) AS slot(value)
  WHERE r.location_id = _location_id
    AND r.reservation_date = _date
    AND r.status IN ('pending', 'confirmed', 'presence_confirmed');
$$;

REVOKE ALL ON FUNCTION public.get_location_booked_slots(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_location_booked_slots(uuid, date) TO anon, authenticated;

CREATE FUNCTION public.check_reservation_periods()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested jsonb;
  period jsonb;
  configured jsonb;
  validate_configuration boolean := true;
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed', 'presence_confirmed') THEN
    RETURN NEW;
  END IF;

  -- Serialize changes for a place and date, including concurrent single-period bookings.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(NEW.location_id::text || ':' || NEW.reservation_date::text, 0)
  );

  requested := COALESCE(NEW.time_slots, jsonb_build_array(jsonb_build_object(
    'start', to_char(NEW.start_time, 'HH24:MI'),
    'end', to_char(NEW.end_time, 'HH24:MI')
  )));

  IF TG_OP = 'UPDATE' THEN
    validate_configuration := NEW.time_slots IS DISTINCT FROM OLD.time_slots
      OR NEW.location_id IS DISTINCT FROM OLD.location_id
      OR NEW.start_time IS DISTINCT FROM OLD.start_time
      OR NEW.end_time IS DISTINCT FROM OLD.end_time;
  END IF;

  IF NEW.time_slots IS NOT NULL AND validate_configuration THEN
    SELECT l.time_slots INTO configured
    FROM public.locations l WHERE l.id = NEW.location_id;

    IF jsonb_typeof(requested) <> 'array' OR jsonb_array_length(requested) = 0 THEN
      RAISE EXCEPTION 'Selecione pelo menos um período';
    END IF;

    FOR period IN SELECT value FROM jsonb_array_elements(requested) LOOP
      IF jsonb_typeof(period) <> 'object'
         OR (period->>'start') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         OR (period->>'end') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         OR NOT EXISTS (
           SELECT 1 FROM jsonb_array_elements(COALESCE(configured, '[]'::jsonb)) c
           WHERE c->>'start' = period->>'start' AND c->>'end' = period->>'end'
         ) THEN
        RAISE EXCEPTION 'Período inválido para este local';
      END IF;
    END LOOP;

    IF (SELECT count(DISTINCT value) FROM jsonb_array_elements(requested)) <> jsonb_array_length(requested)
       OR NEW.start_time <> (requested->0->>'start')::time
       OR NEW.end_time <> (requested->(jsonb_array_length(requested) - 1)->>'end')::time THEN
      RAISE EXCEPTION 'Períodos duplicados ou limites inconsistentes';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reservations r
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(r.time_slots, jsonb_build_array(jsonb_build_object(
      'start', to_char(r.start_time, 'HH24:MI'),
      'end', to_char(r.end_time, 'HH24:MI')
    )))) booked(value)
    JOIN LATERAL jsonb_array_elements(requested) wanted(value) ON
      booked.value->>'start' = wanted.value->>'start'
      AND booked.value->>'end' = wanted.value->>'end'
    WHERE r.id <> NEW.id
      AND r.location_id = NEW.location_id
      AND r.reservation_date = NEW.reservation_date
      AND r.status IN ('pending', 'confirmed', 'presence_confirmed')
  ) THEN
    RAISE EXCEPTION 'Um dos períodos já foi reservado';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_reservation_periods_before_write
  BEFORE INSERT OR UPDATE OF location_id, reservation_date, start_time, end_time, time_slots, status
  ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.check_reservation_periods();

REVOKE ALL ON FUNCTION public.check_reservation_periods() FROM PUBLIC;

-- Payment creation is part of the reservation transaction. If it fails,
-- the reservation is rolled back too, so no booking is left without a charge.
CREATE FUNCTION public.create_reservation_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Legacy clients still create their own payment for rows without time_slots.
  IF NEW.time_slots IS NOT NULL THEN
    INSERT INTO public.payments (reservation_id, amount)
    VALUES (NEW.id, NEW.total_price);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_reservation_payment_after_insert
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.create_reservation_payment();

REVOKE ALL ON FUNCTION public.create_reservation_payment() FROM PUBLIC;
