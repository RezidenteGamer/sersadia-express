-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create members table for managing club members
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS policies for members
CREATE POLICY "Admins can manage members"
  ON public.members
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can check if they are members"
  ON public.members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add member pricing columns to locations
ALTER TABLE public.locations 
  ADD COLUMN price_per_hour_member NUMERIC DEFAULT 0,
  ADD COLUMN price_fixed_member NUMERIC;

-- Add time_slots column to locations for multiple availability periods
ALTER TABLE public.locations 
  ADD COLUMN time_slots JSONB DEFAULT '[{"start": "08:00", "end": "17:00"}, {"start": "18:00", "end": "01:30"}]'::jsonb;

-- Create storage bucket for location images
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-images', 'location-images', true);

-- Storage policies for location images
CREATE POLICY "Anyone can view location images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'location-images');

CREATE POLICY "Admins can upload location images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'location-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update location images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'location-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete location images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'location-images' AND is_admin(auth.uid()));

-- Trigger for updated_at on members
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();