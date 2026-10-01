import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

export interface LocationPeriod {
  start: string;
  end: string;
}

const fallbackPeriods: LocationPeriod[] = [
  { start: '08:00', end: '17:00' },
  { start: '18:30', end: '01:30' },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function getLocationPeriods(location: Location): LocationPeriod[] {
  if (!Array.isArray(location.time_slots)) return fallbackPeriods;

  const periods = location.time_slots.flatMap(value => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) &&
      typeof value.start === 'string' && typeof value.end === 'string') {
      return [{ start: value.start, end: value.end }];
    }
    return [];
  });
  return periods.length > 0 ? periods : fallbackPeriods;
}

export function getPeriodPrice(location: Location, isMember = false): number {
  const fixed = isMember && location.price_fixed_member != null
    ? location.price_fixed_member
    : location.price_fixed;
  const standard = isMember && location.price_per_hour_member != null
    ? location.price_per_hour_member
    : location.price_per_hour;
  return fixed != null && fixed > 0 ? fixed : standard;
}

export function getMemberPeriodPrice(location: Location): number | null {
  if (location.price_fixed_member == null && location.price_per_hour_member == null) return null;
  return getPeriodPrice(location, true);
}
