import type { Tables } from '@/integrations/supabase/types';

export type ReservationWithDetails = Tables<'reservations'> & {
  location?: Pick<Tables<'locations'>, 'name' | 'images'>;
  user_profile?: Pick<Tables<'profiles'>, 'full_name' | 'email'>;
  payment?: Tables<'payments'> | null;
};

export type StatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'expired';
export type QuickFilter = 'today' | 'this_week' | 'awaiting_receipt' | 'refund_pending';
