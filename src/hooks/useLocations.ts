import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Location = Tables<'locations'>;

export function useLocations(includeInactive = false) {
  return useQuery({
    queryKey: ['locations', { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    enabled: !!id,
  });
}

export function useLocationAvailability(locationId: string, date: string) {
  return useQuery({
    queryKey: ['location-availability', locationId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('start_time, end_time, status')
        .eq('location_id', locationId)
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed', 'presence_confirmed']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!locationId && !!date,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'locations'>) => {
      const { data: location, error } = await supabase
        .from('locations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return location;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Local criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar local: ' + error.message);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<'locations'> }) => {
      const { error } = await supabase
        .from('locations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Local atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar local: ' + error.message);
    },
  });
}

export function useToggleLocationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(isActive ? 'Local ativado!' : 'Local desativado!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}
