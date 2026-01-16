import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type Checkin = Tables<'checkins'>;
export type CheckinSettings = Tables<'checkin_settings'>;

export function useCheckinSettings() {
  return useQuery({
    queryKey: ['checkin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as CheckinSettings | null;
    },
  });
}

export function useUpdateCheckinSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<CheckinSettings>) => {
      const { data: existing } = await supabase
        .from('checkin_settings')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('checkin_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('checkin_settings')
          .insert(settings as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-settings'] });
      toast.success('Configurações atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export function usePerformCheckin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reservationId, code }: { reservationId: string; code: string }) => {
      // First verify the code matches the reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('id, code, status, reservation_date')
        .eq('id', reservationId)
        .single();
      
      if (fetchError) throw new Error('Reserva não encontrada');
      
      if (reservation.code.toUpperCase() !== code.toUpperCase()) {
        throw new Error('Código inválido');
      }
      
      if (reservation.status !== 'confirmed') {
        throw new Error('Esta reserva não está confirmada');
      }
      
      const today = new Date().toISOString().split('T')[0];
      if (reservation.reservation_date !== today) {
        throw new Error('Check-in só pode ser feito no dia da reserva');
      }
      
      // Check if already checked in
      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('reservation_id', reservationId)
        .single();
      
      if (existingCheckin) {
        throw new Error('Check-in já realizado para esta reserva');
      }
      
      // Perform checkin
      const { error: checkinError } = await supabase
        .from('checkins')
        .insert({
          reservation_id: reservationId,
          admin_id: user!.id,
        });
      
      if (checkinError) throw checkinError;
      
      // Update reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'presence_confirmed' as any })
        .eq('id', reservationId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      toast.success('Presença confirmada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
