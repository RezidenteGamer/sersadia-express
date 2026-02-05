-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to banner images
CREATE POLICY "Anyone can view banner images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banner-images');

-- Only admins can manage banner images
CREATE POLICY "Admins can manage banner images"
ON storage.objects
FOR ALL
USING (bucket_id = 'banner-images' AND public.is_admin(auth.uid()));