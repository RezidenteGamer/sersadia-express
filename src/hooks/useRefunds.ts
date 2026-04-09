import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type RefundRequest = Tables<'reservations'> & {
  location?: Pick<Tables<'locations'>, 'name' | 'images'>;
  user_profile?: Pick<Tables<'profiles'>, 'full_name' | 'email'>;
};

export function useCancellationRequests() {
  return useQuery({
    queryKey: ['refund-requests'],
    queryFn: async () => {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*, location:locations(name, images)')
        .in('status', ['cancelled_by_user', 'cancelled_by_admin'] as any[])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(reservations.map(r => r.user_id))];
      if (userIds.length === 0) return [] as RefundRequest[];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return reservations.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id),
      })) as RefundRequest[];
    },
  });
}

export function useApproveRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, refundAmount }: { id: string; refundAmount: number }) => {
      const { error } = await supabase
        .from('reservations')
        .update({
          refund_status: 'approved',
          refund_amount: refundAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reembolso aprovado!');
    },
    onError: (error) => {
      toast.error('Erro ao aprovar reembolso: ' + error.message);
    },
  });
}

export function useMarkRefundCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('reservations')
        .update({
          refund_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reembolso marcado como concluído!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });
}

/**
 * Check if a cancellation was made within 48h of the reservation start time
 */
export function isWithin48Hours(reservationDate: string, startTime: string, cancelledAt?: string | null): boolean {
  const [year, month, day] = reservationDate.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  const reservationStart = new Date(year, month - 1, day, hours, minutes);
  
  const cancelTime = cancelledAt ? new Date(cancelledAt) : new Date();
  const diffMs = reservationStart.getTime() - cancelTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours < 48;
}
