import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { businessDateKey, businessDayRange, parseCalendarDate } from '@/lib/businessDate';

export interface FinancialFilters {
  dateFrom: Date;
  dateTo: Date;
  locationId?: string;
  paymentMethod?: string;
  isPaid?: boolean | 'all';
}

interface PaymentRow {
  id: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  created_at: string;
  notes: string | null;
  mp_payment_id: string | null;
  reservation: {
    id: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    user_id: string;
    location_id: string;
    location: { name: string } | null;
  } | null;
}

async function fetchPayments(filters: FinancialFilters): Promise<PaymentRow[]> {
  const { start, endExclusive } = businessDayRange(filters.dateFrom, filters.dateTo);
  const statuses = filters.isPaid === true ? [true] : filters.isPaid === false ? [false] : [true, false];
  const pages = await Promise.all(statuses.map(async isPaid => {
    const timestamp = isPaid ? 'paid_at' : 'created_at';
    const rows: PaymentRow[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase.from('payments').select(`
        *, reservation:reservations(
          id, reservation_date, start_time, end_time, user_id, location_id,
          location:locations(name)
        )
      `).eq('is_paid', isPaid)
        .gte(timestamp, start).lt(timestamp, endExclusive)
        .order(timestamp, { ascending: false })
        .range(offset, offset + 999);
      if (filters.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
      const { data, error } = await query;
      if (error) throw error;
      rows.push(...((data || []) as unknown as PaymentRow[]));
      if (!data || data.length < 1000) break;
    }
    return rows;
  }));
  let payments = pages.flat();

  if (filters.locationId) {
    payments = payments.filter(p => p.reservation?.location_id === filters.locationId);
  }

  return payments;
}

export function useFinancialSummary(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: async () => {
      const payments = await fetchPayments({ ...filters, isPaid: 'all' });

      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const received = payments.filter(p => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = payments.filter(p => !p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);
      const paidCount = payments.filter(p => p.is_paid).length;
      const avgTicket = paidCount > 0 ? received / paidCount : 0;
      const defaultRate = totalRevenue > 0 ? (pending / totalRevenue) * 100 : 0;

      return { totalRevenue, received, pending, avgTicket, defaultRate, totalPayments: payments.length, paidCount };
    },
  });
}

export function useRevenueByLocation(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-by-location', filters],
    queryFn: async () => {
      const payments = await fetchPayments({ ...filters, isPaid: 'all' });
      const map: Record<string, { name: string; received: number; pending: number; total: number }> = {};

      payments.forEach(p => {
        const locId = p.reservation?.location_id || 'unknown';
        const locName = p.reservation?.location?.name || 'Desconhecido';
        if (!map[locId]) map[locId] = { name: locName, received: 0, pending: 0, total: 0 };
        const amount = Number(p.amount);
        map[locId].total += amount;
        if (p.is_paid) map[locId].received += amount;
        else map[locId].pending += amount;
      });

      return Object.values(map).sort((a, b) => b.total - a.total);
    },
  });
}

export function useRevenueByMethod(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-by-method', filters],
    queryFn: async () => {
      const payments = await fetchPayments({ ...filters, isPaid: true });
      const map: Record<string, number> = {};

      payments.forEach(p => {
        const method = p.payment_method || 'Não informado';
        map[method] = (map[method] || 0) + Number(p.amount);
      });

      return Object.entries(map).map(([name, value]) => ({ name, value }));
    },
  });
}

export function useDefaulters(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-defaulters', filters],
    queryFn: async () => {
      const payments = await fetchPayments({ ...filters, isPaid: false });

      const userIds = [...new Set(payments.map(p => p.reservation?.user_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        createdAt: p.created_at,
        reservationDate: p.reservation?.reservation_date || '',
        location: p.reservation?.location?.name || '',
        userName: profileMap.get(p.reservation?.user_id || '')?.full_name || 'Desconhecido',
        userEmail: profileMap.get(p.reservation?.user_id || '')?.email || '',
      }));
    },
  });
}

export function useCashFlow(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-cashflow', filters],
    queryFn: async () => {
      const payments = await fetchPayments({ ...filters, isPaid: true });
      const days = eachDayOfInterval({ start: filters.dateFrom, end: filters.dateTo });
      const map: Record<string, number> = {};
      days.forEach(d => { map[format(d, 'yyyy-MM-dd')] = 0; });

      payments.forEach(p => {
        const day = businessDateKey(new Date(p.paid_at!));
        if (map[day] !== undefined) map[day] += Number(p.amount);
      });

      return Object.entries(map).map(([date, value]) => ({
        date: format(parseCalendarDate(date), 'dd/MM', { locale: ptBR }),
        valor: value,
      }));
    },
  });
}

export function useRefunds(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-refunds', filters],
    queryFn: async () => {
      const { start, endExclusive } = businessDayRange(filters.dateFrom, filters.dateTo);
      const refunds: Array<{ id: string; refund_amount: number | null; admin_notes: string | null;
        refund_completed_at: string | null; user_id: string; location?: { name: string } | null }> = [];
      for (let offset = 0; ; offset += 1000) {
        let query = supabase.from('reservations')
          .select('id, refund_amount, admin_notes, refund_completed_at, user_id, location:locations(name)')
          .eq('refund_status', 'completed')
          .gte('refund_completed_at', start).lt('refund_completed_at', endExclusive)
          .order('refund_completed_at', { ascending: false })
          .range(offset, offset + 999);
        if (filters.locationId) query = query.eq('location_id', filters.locationId);
        const { data, error } = await query;
        if (error) throw error;
        refunds.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      const userIds = [...new Set(refunds.map(r => r.user_id))];
      const { data: profiles, error: profilesError } = userIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [], error: null };
      if (profilesError) throw profilesError;
      const profileMap = new Map<string, string>((profiles || []).map(p => [p.id, p.full_name] as const));
      return refunds.map(r => ({
        id: r.id,
        amount: Number(r.refund_amount || 0),
        notes: r.admin_notes,
        createdAt: r.refund_completed_at!,
        location: r.location?.name || '',
        userName: profileMap.get(r.user_id) || 'Desconhecido',
      }));
    },
  });
}

// Custom report builder
export type GroupBy = 'day' | 'week' | 'month' | 'location' | 'method';

export function useCustomReport(filters: FinancialFilters, groupBy: GroupBy, enabled: boolean) {
  return useQuery({
    queryKey: ['financial-custom', filters, groupBy],
    enabled,
    queryFn: async () => {
      const payments = await fetchPayments({ ...filters, isPaid: 'all' });

      const grouped: Record<string, { label: string; totalRevenue: number; received: number; pending: number; count: number }> = {};

      payments.forEach(p => {
        let key: string;
        let label: string;
        const amount = Number(p.amount);

        switch (groupBy) {
          case 'day': {
            const d = p.paid_at || p.created_at;
            key = businessDateKey(new Date(d));
            label = format(parseCalendarDate(key), 'dd/MM/yyyy');
            break;
          }
          case 'week': {
            const d = parseCalendarDate(businessDateKey(new Date(p.paid_at || p.created_at)));
            const ws = startOfWeek(d, { locale: ptBR });
            key = format(ws, 'yyyy-MM-dd');
            label = `Sem. ${format(ws, 'dd/MM')}`;
            break;
          }
          case 'month': {
            const d = parseCalendarDate(businessDateKey(new Date(p.paid_at || p.created_at)));
            key = format(d, 'yyyy-MM');
            label = format(d, 'MMM/yy', { locale: ptBR });
            break;
          }
          case 'location': {
            key = p.reservation?.location_id || 'unknown';
            label = p.reservation?.location?.name || 'Desconhecido';
            break;
          }
          case 'method': {
            key = p.payment_method || 'none';
            label = p.payment_method || 'Não informado';
            break;
          }
        }

        if (!grouped[key]) grouped[key] = { label, totalRevenue: 0, received: 0, pending: 0, count: 0 };
        grouped[key].totalRevenue += amount;
        grouped[key].count++;
        if (p.is_paid) grouped[key].received += amount;
        else grouped[key].pending += amount;
      });

      return Object.values(grouped).sort((a, b) => {
        if (groupBy === 'day' || groupBy === 'week' || groupBy === 'month') return a.label.localeCompare(b.label);
        return b.totalRevenue - a.totalRevenue;
      });
    },
  });
}

export function useLocationsForFilter() {
  return useQuery({
    queryKey: ['locations-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data || [];
    },
  });
}
