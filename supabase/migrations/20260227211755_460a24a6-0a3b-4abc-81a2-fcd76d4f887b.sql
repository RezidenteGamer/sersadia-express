
CREATE TABLE public.member_dependents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('filho', 'filha', 'conjuge')),
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.member_dependents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dependents of their membership"
ON public.member_dependents
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_dependents.member_id
      AND (m.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.mbrf_id = m.mbrf_id
      ))
    )
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "Users can insert dependents on their membership"
ON public.member_dependents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_dependents.member_id
      AND (m.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.mbrf_id = m.mbrf_id
      ))
    )
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "Users can update dependents on their membership"
ON public.member_dependents
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_dependents.member_id
      AND (m.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.mbrf_id = m.mbrf_id
      ))
    )
    OR is_admin(auth.uid())
  )
);

CREATE POLICY "Users can delete dependents on their membership"
ON public.member_dependents
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_dependents.member_id
      AND (m.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.mbrf_id = m.mbrf_id
      ))
    )
    OR is_admin(auth.uid())
  )
);

CREATE TRIGGER update_member_dependents_updated_at
BEFORE UPDATE ON public.member_dependents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
