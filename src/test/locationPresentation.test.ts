import { describe, expect, it } from 'vitest';
import { getLocationPeriods, getMemberPeriodPrice, getPeriodPrice } from '@/lib/locationPresentation';
import type { Tables } from '@/integrations/supabase/types';

const location: Tables<'locations'> = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Espaço de teste', description: null, capacity: 20, images: [],
  price_fixed: null, price_fixed_member: null,
  price_per_hour: 100, price_per_hour_member: 60,
  available_start_time: '08:00:00', available_end_time: '17:00:00',
  time_slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  rules: null, is_active: true, display_order: 1,
  cancellation_deadline_hours: 24, cancellation_fee_type: 'percentage', cancellation_fee_value: 0,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

describe('preços e períodos apresentados na reserva', () => {
  it('apresenta os mesmos períodos no catálogo e na seleção da reserva', () => {
    expect(getLocationPeriods(location)).toEqual([
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ]);
  });

  it('respeita a prioridade do preço fixo usada pelo banco', () => {
    const fixed = { ...location, price_fixed: 120 };
    expect(getPeriodPrice(fixed)).toBe(120);
    expect(getPeriodPrice(fixed, true)).toBe(120);
    expect(getPeriodPrice({ ...fixed, price_fixed_member: 80 }, true)).toBe(80);
  });

  it('usa o valor por período quando o preço fixo é zero ou ausente', () => {
    expect(getPeriodPrice(location, true)).toBe(60);
    expect(getPeriodPrice({ ...location, price_fixed: 120, price_fixed_member: 0 }, true)).toBe(60);
  });

  it('não anuncia preço de sócio quando nenhum foi configurado', () => {
    expect(getMemberPeriodPrice({ ...location, price_per_hour_member: null })).toBeNull();
  });
});
