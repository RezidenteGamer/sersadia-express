-- Fix 1: Remove overly permissive notifications INSERT policy
-- Edge functions use service role key and bypass RLS, so this won't affect them
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;

-- Fix 2: Tighten admin-wallpapers storage upload policy
-- Replace the permissive INSERT policy with one that restricts uploads to user's own folder
-- and limits file size to 5MB
DROP POLICY IF EXISTS "Authenticated users can upload wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own wallpapers" ON storage.objects;

CREATE POLICY "Users can upload wallpapers to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-wallpapers'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (COALESCE((metadata->>'size')::int, 0) < 5242880) -- 5MB limit
);