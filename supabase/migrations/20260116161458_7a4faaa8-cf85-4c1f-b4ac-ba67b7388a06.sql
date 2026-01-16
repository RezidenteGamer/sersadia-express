-- Fix notifications INSERT policy to be more restrictive
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);