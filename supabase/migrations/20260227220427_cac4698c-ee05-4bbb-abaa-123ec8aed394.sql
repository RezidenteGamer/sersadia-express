
-- Fix 1: Restrict members table SELECT policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can check if they are members" ON public.members;

-- Users can only view their own member record (by user_id) or admins see all
CREATE POLICY "Users can view own member record"
  ON public.members
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- RPC function so users can look up their membership by mbrf_id securely
CREATE OR REPLACE FUNCTION public.get_membership_by_mbrf_id(_mbrf_id text)
RETURNS SETOF public.members
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.members
  WHERE mbrf_id = _mbrf_id
    AND is_active = true
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND profiles.mbrf_id = _mbrf_id
      )
    )
  LIMIT 1;
$$;

-- RPC function to check membership status without exposing data
CREATE OR REPLACE FUNCTION public.check_membership_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM members 
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;
