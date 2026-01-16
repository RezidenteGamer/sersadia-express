import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Reservation = Tables<'reservations'> & {
  location?: Pick<Tables<'locations'>, 'name' | 'images'>;
  user_profile?: Pick<Tables<'profiles'>, 'full_name' | 'email'>;
};

export function useUserReservations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reservations', 'user', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, location:locations(name, images)')
        .eq('user_id', user!.id)
        .order('reservation_date', { ascending: false });
      
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user,
  });
}

export function useAllReservations(filters?: {
  status?: Enums<'reservation_status'>;
  locationId?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: ['reservations', 'all', filters],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select('*, location:locations(name, images)')
        .order('reservation_date', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters?.date) {
        query = query.eq('reservation_date', filters.date);
      }
      
      const { data: reservations, error } = await query;
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(reservations.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return reservations.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id),
      })) as Reservation[];
    },
  });
}

export function useTodayReservations() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['reservations', 'today'],
    queryFn: async () => {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*, location:locations(name, images)')
        .eq('reservation_date', today)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(reservations.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return reservations.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id),
      })) as Reservation[];
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<TablesInsert<'reservations'>, 'user_id' | 'code'>) => {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({ ...data, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva solicitada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar reserva: ' + error.message);
    },
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, adminNotes }: { 
      id: string; 
      status: string;
      adminNotes?: string;
    }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: status as any, 
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const status = isAdmin ? 'cancelled_by_admin' : 'cancelled_by_user';
      const { error } = await supabase
        .from('reservations')
        .update({ status: status as any, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva cancelada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar reserva: ' + error.message);
    },
  });
}
