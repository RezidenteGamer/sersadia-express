import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;
export type AdminPermission = Tables<'admin_permissions'>;

export type UserWithRole = Profile & {
  role?: UserRole;
  permissions?: AdminPermission[];
};

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      
      if (profilesError) throw profilesError;
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      const { data: permissions, error: permissionsError } = await supabase
        .from('admin_permissions')
        .select('*');
      
      if (permissionsError) throw permissionsError;
      
      return profiles.map(profile => {
        const userRoles = roles.filter(r => r.user_id === profile.id);
        return {
          ...profile,
          // A user can end up with more than one role row; admin should win.
          role: userRoles.find(r => r.role === 'admin') || userRoles[0],
          permissions: permissions.filter(p => p.user_id === profile.id),
        };
      }) as UserWithRole[];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      // Delete-then-insert instead of select+single()+update: a user can end
      // up with more than one row here (nothing enforces uniqueness on
      // user_id alone), and .single() throws when more than one row matches,
      // which surfaced as "Erro ao atualizar o papel" for affected accounts.
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Papel do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar papel: ' + error.message);
    },
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      permissions 
    }: { 
      userId: string; 
      permissions: string[];
    }) => {
      // Delete existing permissions
      await supabase
        .from('admin_permissions')
        .delete()
        .eq('user_id', userId);
      
      // Insert new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('admin_permissions')
          .insert(permissions.map(permission => ({
            user_id: userId,
            permission: permission as any,
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Permissões atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar permissões: ' + error.message);
    },
  });
}
