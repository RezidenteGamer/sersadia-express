import { useState, useMemo, useEffect } from 'react';
import { useAllReservations } from '@/hooks/useReservations';
import { usePayments } from '@/hooks/usePayments';
import { useLocations } from '@/hooks/useLocations';
import type { Payment } from '@/hooks/usePayments';
import type { StatusFilter, QuickFilter, ReservationWithDetails } from './types';
import type { Enums } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from 'react-day-picker';

export function useReservationCenter() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter | null>(null);
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Map status filter to actual DB statuses
  const statusMap: Record<StatusFilter, Enums<'reservation_status'>[] | undefined> = {
    all: undefined,
    pending: ['pending'],
    confirmed: ['confirmed', 'presence_confirmed'],
    cancelled: ['cancelled_by_user', 'cancelled_by_admin'],
    expired: ['expired'],
  };

  // Convert dateRange to start/end date strings for the query
  const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined;

  const { data: reservations, isLoading: loadingReservations } = useAllReservations({
    statuses: statusFilter !== 'all' ? statusMap[statusFilter] : undefined,
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
    startDate,
    endDate,
  });

  const { data: allPayments } = usePayments();
  const { data: locations } = useLocations(true);

  // Build a map of payments by reservation_id
  const paymentMap = useMemo(() => {
    const map = new Map<string, Payment>();
    allPayments?.forEach(p => {
      if (!map.has(p.reservation_id)) {
        map.set(p.reservation_id, p);
      }
    });
    return map;
  }, [allPayments]);

  // Merge reservations with payment data
  const enrichedReservations: ReservationWithDetails[] = useMemo(() => {
    if (!reservations) return [];
    return reservations.map(r => ({
      ...r,
      payment: paymentMap.get(r.id) || null,
    }));
  }, [reservations, paymentMap]);

  // Apply search + quick filters
  const filtered = useMemo(() => {
    let result = enrichedReservations;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        r.code.toLowerCase().includes(s) ||
        r.user_profile?.full_name?.toLowerCase().includes(s) ||
        r.user_profile?.email?.toLowerCase().includes(s) ||
        r.location?.name?.toLowerCase().includes(s)
      );
    }

    if (quickFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(r => r.reservation_date === today);
    } else if (quickFilter === 'this_week') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const start = startOfWeek.toISOString().split('T')[0];
      const end = endOfWeek.toISOString().split('T')[0];
      result = result.filter(r => r.reservation_date >= start && r.reservation_date <= end);
    } else if (quickFilter === 'awaiting_receipt') {
      result = result.filter(r => r.status === 'pending' && !r.payment?.receipt_url);
    } else if (quickFilter === 'refund_pending') {
      result = result.filter(r =>
        ['cancelled_by_user', 'cancelled_by_admin'].includes(r.status) &&
        (r.refund_status === 'pending' || r.refund_status === 'none')
      );
    }

    return result;
  }, [enrichedReservations, search, quickFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter(r => r.status === 'pending').length;
    const totalReceivable = filtered
      .filter(r => r.status === 'pending' && !r.payment?.is_paid)
      .reduce((acc, r) => acc + r.total_price, 0);
    const refundPending = filtered.filter(r =>
      ['cancelled_by_user', 'cancelled_by_admin'].includes(r.status) &&
      (r.refund_status === 'pending' || r.refund_status === 'none')
    ).length;
    return { total, pending, totalReceivable, refundPending };
  }, [filtered]);

  const selectedReservation = useMemo(() => {
    if (!selectedId) return null;
    return filtered.find(r => r.id === selectedId) || null;
  }, [selectedId, filtered]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('reservation-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {})
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {})
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return {
    search, setSearch,
    statusFilter, setStatusFilter,
    quickFilter, setQuickFilter,
    locationFilter, setLocationFilter,
    dateRange, setDateRange,
    selectedId, setSelectedId,
    filtered,
    stats,
    selectedReservation,
    locations,
    isLoading: loadingReservations,
    paymentMap,
  };
}
