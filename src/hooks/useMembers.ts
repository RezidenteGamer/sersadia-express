import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
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
        .order('id', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const allMembers: Member[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await query.range(offset, offset + 999);
        if (error) throw error;
        allMembers.push(...(data as Member[]));
        if (!data || data.length < 1000) break;
      }
      return allMembers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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

export function useToggleMemberPermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPermanent }: { id: string; isPermanent: boolean }) => {
      const { error } = await supabase
        .from('members')
        .update({ is_permanent: isPermanent, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isPermanent }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(isPermanent ? 'Sócio marcado como permanente!' : 'Sócio deixou de ser permanente.');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar sócio: ' + error.message);
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

export function useMemberImportPreview(rows: MemberSheetRow[] | null) {
  return useQuery({
    queryKey: ['members-import-preview', rows],
    enabled: !!rows,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('sync_members_from_sheet', {
        _rows: rows! as unknown as Json, _dry_run: true,
      });
      if (error) throw error;
      return data as unknown as ImportMembersResult;
    },
  });
}

export function useImportMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rows, expectedDeactivated }: { rows: MemberSheetRow[]; expectedDeactivated: number }): Promise<ImportMembersResult> => {
      const { data, error } = await supabase.rpc('sync_members_from_sheet', {
        _rows: rows as unknown as Json, _dry_run: false, _expected_deactivated: expectedDeactivated,
      });
      if (error) throw error;
      return data as unknown as ImportMembersResult;
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
