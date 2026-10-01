import type { Tables } from '@/integrations/supabase/types';

type ReservationTimes = Pick<Tables<'reservations'>, 'start_time' | 'end_time' | 'time_slots'>;

export function formatReservationPeriods(reservation: ReservationTimes): string {
  if (Array.isArray(reservation.time_slots) && reservation.time_slots.length > 0) {
    const periods = reservation.time_slots.map(value => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const { start, end } = value;
      return typeof start === 'string' && typeof end === 'string' ? `${start} - ${end}` : null;
    });
    if (periods.every(Boolean)) return periods.join(' e ');
  }

  return `${reservation.start_time.substring(0, 5)} - ${reservation.end_time.substring(0, 5)}`;
}
