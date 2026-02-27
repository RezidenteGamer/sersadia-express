import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Dependent {
  id: string;
  member_id: string;
  name: string;
  relationship: 'filho' | 'filha' | 'conjuge';
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useDependents(memberId: string | undefined) {
  return useQuery({
    queryKey: ['dependents', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_dependents')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Dependent[];
    },
    enabled: !!memberId,
  });
}

export function useCreateDependent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { member_id: string; name: string; relationship: string; birth_date?: string | null }) => {
      const { data: dep, error } = await supabase
        .from('member_dependents')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return dep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
      toast.success('Dependente adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar dependente: ' + error.message);
    },
  });
}

export function useDeleteDependent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_dependents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
      toast.success('Dependente removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover dependente: ' + error.message);
    },
  });
}
