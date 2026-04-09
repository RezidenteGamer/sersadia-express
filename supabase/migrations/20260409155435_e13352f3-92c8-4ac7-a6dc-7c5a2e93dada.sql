
-- Drop the old restrictive policy
DROP POLICY "Users can update own pending reservations" ON public.reservations;

-- Recreate allowing cancel on pending OR confirmed reservations
CREATE POLICY "Users can update own reservations"
ON public.reservations
FOR UPDATE
USING (
  (
    auth.uid() = user_id
    AND status IN ('pending', 'confirmed')
  )
  OR has_permission(auth.uid(), 'manage_reservations')
  OR is_admin(auth.uid())
);
