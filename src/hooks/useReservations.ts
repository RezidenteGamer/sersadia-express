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
      // Set expiration to 30 minutes from now for pending reservations
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({ ...data, user_id: user!.id, expires_at: expiresAt } as any)
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
    mutationFn: async ({ id, refundAmount }: { id: string; refundAmount?: number }) => {
      // Try to refund the payment
      try {
        const response = await supabase.functions.invoke('refund-payment', {
          body: { reservationId: id, refundAmount },
        });
        
        if (response.error) {
          console.warn('Refund attempt warning:', response.error);
        } else if (response.data?.refunded) {
          const amt = response.data.refundedAmount;
          toast.info(`Reembolso de R$ ${Number(amt).toFixed(2)} processado via Mercado Pago`);
        }
      } catch (refundError) {
        console.warn('Refund attempt failed:', refundError);
      }

      const status = isAdmin ? 'cancelled_by_admin' : 'cancelled_by_user';
      const { error } = await supabase
        .from('reservations')
        .update({ status: status as any, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Reserva cancelada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar reserva: ' + error.message);
    },
  });
}

// Helper: calculate cancellation fee
export function calculateCancellationFee(
  totalPrice: number,
  feeType: string,
  feeValue: number,
  deadlineHours: number,
  reservationDate: string,
  startTime: string,
): { fee: number; refundAmount: number; isWithinDeadline: boolean } {
  if (feeValue <= 0) {
    return { fee: 0, refundAmount: totalPrice, isWithinDeadline: false };
  }

  // Calculate deadline datetime
  const [year, month, day] = reservationDate.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  const reservationStart = new Date(year, month - 1, day, hours, minutes);
  const deadline = new Date(reservationStart.getTime() - deadlineHours * 60 * 60 * 1000);
  const now = new Date();

  if (now <= deadline) {
    // Outside deadline - no fee
    return { fee: 0, refundAmount: totalPrice, isWithinDeadline: false };
  }

  // Within deadline - apply fee
  let fee: number;
  if (feeType === 'percentage') {
    fee = totalPrice * (feeValue / 100);
  } else {
    fee = Math.min(feeValue, totalPrice);
  }

  fee = Math.round(fee * 100) / 100;
  const refundAmount = Math.max(0, Math.round((totalPrice - fee) * 100) / 100);

  return { fee, refundAmount, isWithinDeadline: true };
}
