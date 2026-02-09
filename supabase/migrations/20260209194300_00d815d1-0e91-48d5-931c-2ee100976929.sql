
-- Create storage bucket for admin wallpapers
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-wallpapers', 'admin-wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload wallpapers
CREATE POLICY "Authenticated users can upload wallpapers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admin-wallpapers' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Anyone can view wallpapers"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-wallpapers');

-- Allow users to delete their own wallpapers
CREATE POLICY "Users can delete their own wallpapers"
ON storage.objects FOR DELETE
USING (bucket_id = 'admin-wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to persist admin wallpaper preferences per user
CREATE TABLE public.admin_wallpaper_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wallpaper_config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_wallpaper_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallpaper preference"
ON public.admin_wallpaper_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallpaper preference"
ON public.admin_wallpaper_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallpaper preference"
ON public.admin_wallpaper_preferences FOR UPDATE
USING (auth.uid() = user_id);
