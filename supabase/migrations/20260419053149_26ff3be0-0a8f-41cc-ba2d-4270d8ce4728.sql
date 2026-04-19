
-- Tighten admin_permissions: only admins with manage_users can write
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.admin_permissions;

CREATE POLICY "Admins with manage_users can view all permissions"
ON public.admin_permissions
FOR SELECT
USING (public.has_permission(auth.uid(), 'manage_users'));

CREATE POLICY "Admins with manage_users can insert permissions"
ON public.admin_permissions
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'manage_users'));

CREATE POLICY "Admins with manage_users can update permissions"
ON public.admin_permissions
FOR UPDATE
USING (public.has_permission(auth.uid(), 'manage_users'))
WITH CHECK (public.has_permission(auth.uid(), 'manage_users'));

CREATE POLICY "Admins with manage_users can delete permissions"
ON public.admin_permissions
FOR DELETE
USING (public.has_permission(auth.uid(), 'manage_users'));

-- Tighten user_roles: only admins with manage_users can write
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Admins with manage_users can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_permission(auth.uid(), 'manage_users') OR auth.uid() = user_id);

CREATE POLICY "Admins with manage_users can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'manage_users'));

CREATE POLICY "Admins with manage_users can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_permission(auth.uid(), 'manage_users'))
WITH CHECK (public.has_permission(auth.uid(), 'manage_users'));

CREATE POLICY "Admins with manage_users can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_permission(auth.uid(), 'manage_users'));
