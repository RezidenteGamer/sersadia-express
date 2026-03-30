
-- Create pix_settings table (singleton config table)
CREATE TABLE public.pix_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_key text NOT NULL DEFAULT '',
  pix_key_type text NOT NULL DEFAULT 'cpf',
  beneficiary_name text NOT NULL DEFAULT '',
  qr_code_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read active pix settings
CREATE POLICY "Anyone can view pix settings" ON public.pix_settings
  FOR SELECT TO public USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage pix settings" ON public.pix_settings
  FOR ALL TO public USING (is_admin(auth.uid()));

-- Insert default row
INSERT INTO public.pix_settings (pix_key, pix_key_type, beneficiary_name)
VALUES ('', 'cpf', '');
