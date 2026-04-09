import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type Payment = Tables<'payments'> & {
  reservation?: Tables<'reservations'> & {
    location?: Pick<Tables<'locations'>, 'name'>;
  };
  user_profile?: Pick<Tables<'profiles'>, 'full_name' | 'email'>;
};

export function usePayments(filters?: { isPaid?: boolean }) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          reservation:reservations(
            *,
            location:locations(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.isPaid !== undefined) {
        query = query.eq('is_paid', filters.isPaid);
      }
      
      const { data: payments, error } = await query;
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(payments.map(p => p.reservation?.user_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return payments.map(p => ({
        ...p,
        user_profile: p.reservation?.user_id ? profileMap.get(p.reservation.user_id) : undefined,
      })) as Payment[];
    },
  });
}

export function useMarkPaymentAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      paymentMethod, 
      notes 
    }: { 
      id: string; 
      paymentMethod: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          notes,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento registrado!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      reservationId: string;
      amount: number;
    }) => {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          reservation_id: data.reservationId,
          amount: data.amount,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar pagamento: ' + error.message);
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, receiptUrl }: { reservationId: string; receiptUrl: string }) => {
      const { error } = await supabase
        .from('payments')
        .update({ receipt_url: receiptUrl })
        .eq('reservation_id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error('Erro ao salvar comprovante: ' + error.message);
    },
  });
}
