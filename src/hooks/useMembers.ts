import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { MemberSheetRow } from '@/lib/membersSpreadsheet';

export type Member = Tables<'members'>;

export interface ImportMembersResult {
  created: number;
  updated: number;
  deactivated: number;
}

export function useMembers(includeInactive = false) {
  return useQuery({
    queryKey: ['members', { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Member;
    },
    enabled: !!id,
  });
}

export function useUserMembership(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-membership', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // First try to find by user_id direct link
      const { data: directMember, error: directError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (directError) throw directError;
      if (directMember) return directMember as Member;
      
      // If not found, try to match by mbrf_id using secure RPC
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('mbrf_id')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile?.mbrf_id) return null;
      
      // Use secure RPC function to find member by mbrf_id
      const { data: memberByMbrfId, error: memberError } = await supabase
        .rpc('get_membership_by_mbrf_id', { _mbrf_id: profile.mbrf_id })
        .maybeSingle();
      
      if (memberError) throw memberError;
      return memberByMbrfId as Member | null;
    },
    enabled: !!userId,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'members'>) => {
      const { data: member, error } = await supabase
        .from('members')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Sócio cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar sócio: ' + error.message);
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<'members'> }) => {
      const { error } = await supabase
        .from('members')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Sócio atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar sócio: ' + error.message);
    },
  });
}

export function useToggleMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('members')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(isActive ? 'Sócio ativado!' : 'Sócio desativado!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Sócio removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover sócio: ' + error.message);
    },
  });
}

export function useImportMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: MemberSheetRow[]): Promise<ImportMembersResult> => {
      const { data: existing, error: fetchError } = await supabase
        .from('members')
        .select('id, mbrf_id, is_active')
        .not('mbrf_id', 'is', null);
      if (fetchError) throw fetchError;

      const existingByMbrfId = new Map(existing.map((m) => [m.mbrf_id as string, m]));
      const importedIds = new Set(rows.map((r) => r.mbrf_id));

      const toCreate = rows.filter((r) => !existingByMbrfId.has(r.mbrf_id));
      const toUpdate = rows.filter((r) => existingByMbrfId.has(r.mbrf_id));
      const toDeactivate = existing.filter((m) => m.is_active && !importedIds.has(m.mbrf_id as string));

      if (toCreate.length > 0) {
        const { error } = await supabase.from('members').insert(
          toCreate.map((r) => ({ mbrf_id: r.mbrf_id, name: r.name, is_active: false }))
        );
        if (error) throw error;
      }

      for (const r of toUpdate) {
        const existingMember = existingByMbrfId.get(r.mbrf_id)!;
        const { error } = await supabase
          .from('members')
          .update({ name: r.name, updated_at: new Date().toISOString() })
          .eq('id', existingMember.id);
        if (error) throw error;
      }

      if (toDeactivate.length > 0) {
        const { error } = await supabase
          .from('members')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', toDeactivate.map((m) => m.id));
        if (error) throw error;
      }

      return { created: toCreate.length, updated: toUpdate.length, deactivated: toDeactivate.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(
        `Importação concluída: ${result.created} criados, ${result.updated} atualizados, ${result.deactivated} desativados.`
      );
    },
    onError: (error) => {
      toast.error('Erro ao importar planilha: ' + error.message);
    },
  });
}

export function useLinkMemberToUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, userId }: { memberId: string; userId: string | null }) => {
      const { error } = await supabase
        .from('members')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['user-membership'] });
      toast.success('Vínculo atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao vincular: ' + error.message);
    },
  });
}
