import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  let query = supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        id, reservation_date, start_time, end_time, user_id, location_id,
        location:locations(name)
      )
    `)
    .gte('created_at', startOfDay(filters.dateFrom).toISOString())
    .lte('created_at', endOfDay(filters.dateTo).toISOString())
    .order('created_at', { ascending: false });

  if (filters.isPaid !== undefined && filters.isPaid !== 'all') {
    query = query.eq('is_paid', filters.isPaid);
  }
  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod);
  }

  const { data, error } = await query;
  if (error) throw error;

  let payments = (data || []) as unknown as PaymentRow[];

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
        const day = p.paid_at ? p.paid_at.split('T')[0] : p.created_at.split('T')[0];
        if (map[day] !== undefined) map[day] += Number(p.amount);
      });

      return Object.entries(map).map(([date, value]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        valor: value,
      }));
    },
  });
}

export function useRefunds(filters: FinancialFilters) {
  return useQuery({
    queryKey: ['financial-refunds', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          reservation:reservations(
            id, reservation_date, user_id, location_id,
            location:locations(name)
          )
        `)
        .not('notes', 'is', null)
        .ilike('notes', '%estorn%')
        .gte('created_at', startOfDay(filters.dateFrom).toISOString())
        .lte('created_at', endOfDay(filters.dateTo).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map((p: any) => p.reservation?.user_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return (data || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        notes: p.notes,
        createdAt: p.created_at,
        location: p.reservation?.location?.name || '',
        userName: profileMap.get(p.reservation?.user_id || '') || 'Desconhecido',
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
            key = d.split('T')[0];
            label = format(new Date(key), 'dd/MM/yyyy');
            break;
          }
          case 'week': {
            const d = new Date(p.paid_at || p.created_at);
            const ws = startOfWeek(d, { locale: ptBR });
            key = format(ws, 'yyyy-MM-dd');
            label = `Sem. ${format(ws, 'dd/MM')}`;
            break;
          }
          case 'month': {
            const d = new Date(p.paid_at || p.created_at);
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
