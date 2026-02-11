
ALTER TABLE public.locations
ADD COLUMN cancellation_fee_type text NOT NULL DEFAULT 'percentage',
ADD COLUMN cancellation_fee_value numeric NOT NULL DEFAULT 0,
ADD COLUMN cancellation_deadline_hours integer NOT NULL DEFAULT 24;
