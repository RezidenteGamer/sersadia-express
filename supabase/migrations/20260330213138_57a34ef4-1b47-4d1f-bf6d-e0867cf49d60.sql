
-- Allow users to update receipt_url on their own payments
CREATE POLICY "Users can upload receipt on own payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = payments.reservation_id AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = payments.reservation_id AND r.user_id = auth.uid()
  )
);
