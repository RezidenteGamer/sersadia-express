
-- Add display_order column to locations
ALTER TABLE public.locations ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Set initial order based on name
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM public.locations
)
UPDATE public.locations SET display_order = ordered.rn
FROM ordered WHERE public.locations.id = ordered.id;
