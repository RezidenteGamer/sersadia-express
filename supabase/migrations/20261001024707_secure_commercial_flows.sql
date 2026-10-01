-- Keep client-supplied prices and payment state out of the trust boundary.
CREATE OR REPLACE FUNCTION public.price_reservation_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  place public.locations%ROWTYPE;
  member_active boolean;
  fixed_price numeric;
  period_price numeric;
  period_count integer;
BEGIN
  SELECT * INTO place FROM public.locations WHERE id = NEW.location_id;
  IF NOT FOUND OR NOT place.is_active THEN
    RAISE EXCEPTION 'Local indisponível';
  END IF;

  IF auth.uid() IS NOT NULL AND NOT (public.is_admin(auth.uid()) OR public.has_permission(auth.uid(), 'manage_reservations')) THEN
    IF NEW.user_id <> auth.uid() OR NEW.status <> 'pending' OR NEW.time_slots IS NULL THEN
      RAISE EXCEPTION 'Reserva inválida';
    END IF;
    NEW.expires_at := now() + interval '30 minutes';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.is_active AND (m.user_id = NEW.user_id OR m.mbrf_id = (
      SELECT p.mbrf_id FROM public.profiles p WHERE p.id = NEW.user_id
    ))
  ) INTO member_active;

  fixed_price := CASE WHEN member_active AND place.price_fixed_member IS NOT NULL
    THEN place.price_fixed_member ELSE place.price_fixed END;
  period_price := CASE WHEN member_active AND place.price_per_hour_member IS NOT NULL
    THEN place.price_per_hour_member ELSE place.price_per_hour END;
  period_count := CASE WHEN NEW.time_slots IS NULL THEN 1 ELSE jsonb_array_length(NEW.time_slots) END;
  NEW.total_price := (CASE WHEN fixed_price > 0 THEN fixed_price ELSE period_price END) * period_count;
  IF NEW.total_price IS NULL OR NEW.total_price < 0 THEN
    RAISE EXCEPTION 'Preço inválido para este local';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.price_reservation_before_insert() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER price_reservation_before_insert
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.price_reservation_before_insert();

-- Users may only cancel their own pending/confirmed reservation. The trigger
-- decides the refund state from the actual payment, never from client fields.
CREATE OR REPLACE FUNCTION public.protect_reservation_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE paid boolean;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) OR public.has_permission(auth.uid(), 'manage_reservations') THEN
    RETURN NEW;
  END IF;
  IF OLD.user_id <> auth.uid() OR NEW.user_id <> OLD.user_id
     OR OLD.status NOT IN ('pending', 'confirmed') OR NEW.status <> 'cancelled_by_user'
     OR (to_jsonb(NEW) - ARRAY['status','updated_at','cancelled_at','refund_pix_key','refund_pix_name','refund_status','refund_amount'])
        IS DISTINCT FROM
        (to_jsonb(OLD) - ARRAY['status','updated_at','cancelled_at','refund_pix_key','refund_pix_name','refund_status','refund_amount']) THEN
    RAISE EXCEPTION 'Alteração de reserva não permitida';
  END IF;
  SELECT COALESCE(bool_or(is_paid), false) INTO paid
  FROM public.payments WHERE reservation_id = OLD.id;
  NEW.refund_status := CASE WHEN paid THEN 'pending' ELSE 'none' END;
  NEW.refund_amount := 0;
  NEW.refund_pix_key := CASE WHEN paid THEN nullif(trim(NEW.refund_pix_key), '') ELSE NULL END;
  NEW.refund_pix_name := CASE WHEN paid THEN nullif(trim(NEW.refund_pix_name), '') ELSE NULL END;
  IF paid AND (NEW.refund_pix_key IS NULL OR NEW.refund_pix_name IS NULL) THEN
    RAISE EXCEPTION 'Informe os dados PIX para o reembolso';
  END IF;
  NEW.cancelled_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_reservation_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_reservation_update
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.protect_reservation_update();

DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
CREATE POLICY "Users can cancel own reservations" ON public.reservations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled_by_user');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users upload receipts for own reservations" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND r.user_id = auth.uid()
        AND r.status IN ('pending', 'confirmed')
    )
  );
CREATE POLICY "Owners and payment admins view receipts" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'receipts'
    AND ((storage.foldername(name))[1] = auth.uid()::text
         OR public.is_admin(auth.uid())
         OR public.has_permission(auth.uid(), 'manage_payments'))
  );
CREATE POLICY "Owners delete unused receipts" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.receipt_url = name)
  );

CREATE OR REPLACE FUNCTION public.protect_payment_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE owner_id uuid;
DECLARE reservation_state public.reservation_status;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) OR public.has_permission(auth.uid(), 'manage_payments') THEN
    RETURN NEW;
  END IF;
  SELECT user_id, status INTO owner_id, reservation_state
  FROM public.reservations WHERE id = OLD.reservation_id;
  IF owner_id IS DISTINCT FROM auth.uid() OR OLD.is_paid OR reservation_state NOT IN ('pending','confirmed')
     OR (to_jsonb(NEW) - 'receipt_url') IS DISTINCT FROM (to_jsonb(OLD) - 'receipt_url')
     OR NEW.receipt_url IS NULL
     OR split_part(NEW.receipt_url, '/', 1) <> auth.uid()::text
     OR split_part(NEW.receipt_url, '/', 2) <> OLD.reservation_id::text
     OR NOT EXISTS (SELECT 1 FROM storage.objects o
                    WHERE o.bucket_id = 'receipts' AND o.name = NEW.receipt_url) THEN
    RAISE EXCEPTION 'Alteração de pagamento não permitida';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_payment_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_payment_update
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.protect_payment_update();

-- Capture the actual completion event for period-accurate refund reports.
ALTER TABLE public.reservations ADD COLUMN refund_completed_at timestamptz;
CREATE OR REPLACE FUNCTION public.set_refund_completed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.refund_status = 'completed' AND OLD.refund_status IS DISTINCT FROM 'completed' THEN
    NEW.refund_completed_at := now();
  ELSIF NEW.refund_status <> 'completed' THEN
    NEW.refund_completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_refund_completed_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER set_refund_completed_at
  BEFORE UPDATE OF refund_status ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_refund_completed_at();

-- A single RPC makes the preview and the full import see the entire table.
-- The final call is atomic: an error rolls back every create/update/deactivate.
CREATE OR REPLACE FUNCTION public.sync_members_from_sheet(
  _rows jsonb, _dry_run boolean DEFAULT true, _expected_deactivated integer DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_created integer;
DECLARE v_updated integer;
DECLARE v_deactivated integer;
DECLARE v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem importar sócios';
  END IF;
  IF _rows IS NULL OR jsonb_typeof(_rows) <> 'array'
     OR jsonb_array_length(_rows) < 1 OR jsonb_array_length(_rows) > 10000 THEN
    RAISE EXCEPTION 'Planilha vazia ou grande demais';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('members-import', 0));
  SELECT count(*), count(DISTINCT mbrf_id) INTO v_count, v_updated
  FROM jsonb_to_recordset(_rows) AS input(mbrf_id text, name text);
  IF v_count <> jsonb_array_length(_rows) OR v_count <> v_updated OR EXISTS (
    SELECT 1 FROM jsonb_to_recordset(_rows) AS input(mbrf_id text, name text)
    WHERE mbrf_id !~ '^[0-9]{8}$' OR mbrf_id IS NULL
       OR nullif(trim(name), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Planilha contém IDs duplicados ou linhas inválidas';
  END IF;
  SELECT count(*) FILTER (WHERE m.id IS NULL), count(*) FILTER (WHERE m.id IS NOT NULL)
  INTO v_created, v_updated
  FROM jsonb_to_recordset(_rows) AS input(mbrf_id text, name text)
  LEFT JOIN public.members m ON m.mbrf_id = input.mbrf_id;
  SELECT count(*) INTO v_deactivated FROM public.members m
  WHERE m.mbrf_id IS NOT NULL AND m.is_active AND NOT m.is_permanent
    AND NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(_rows) AS input(mbrf_id text, name text)
                    WHERE input.mbrf_id = m.mbrf_id);
  IF NOT _dry_run THEN
    IF _expected_deactivated IS DISTINCT FROM v_deactivated THEN
      RAISE EXCEPTION 'A lista mudou desde a prévia. Revise a importação novamente';
    END IF;
    INSERT INTO public.members (mbrf_id, name, is_active)
    SELECT mbrf_id, trim(name), false
    FROM jsonb_to_recordset(_rows) AS input(mbrf_id text, name text)
    ON CONFLICT (mbrf_id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();
    UPDATE public.members m SET is_active = false, updated_at = now()
    WHERE m.mbrf_id IS NOT NULL AND m.is_active AND NOT m.is_permanent
      AND NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(_rows) AS input(mbrf_id text, name text)
                      WHERE input.mbrf_id = m.mbrf_id);
  END IF;
  RETURN jsonb_build_object('created', v_created, 'updated', v_updated, 'deactivated', v_deactivated);
END;
$$;
REVOKE ALL ON FUNCTION public.sync_members_from_sheet(jsonb, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_members_from_sheet(jsonb, boolean, integer) TO authenticated;
