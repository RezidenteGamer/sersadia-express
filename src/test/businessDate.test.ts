import { describe, expect, it } from 'vitest';
import { businessDateKey, businessDayRange, businessDayStart, parseCalendarDate } from '@/lib/businessDate';
import { format } from 'date-fns';

describe('datas de operação em São Paulo', () => {
  it('não troca o dia antes da meia-noite local', () => {
    expect(businessDateKey(new Date('2026-10-01T02:30:00Z'))).toBe('2026-09-30');
    expect(businessDateKey(new Date('2026-10-01T03:30:00Z'))).toBe('2026-10-01');
  });

  it('filtra o dia inteiro no fuso do negócio', () => {
    expect(businessDayStart('2026-10-01').toISOString()).toBe('2026-10-01T03:00:00.000Z');
    const range = businessDayRange(new Date(2026, 9, 1), new Date(2026, 9, 1));
    expect(range).toEqual({
      start: '2026-10-01T03:00:00.000Z',
      endExclusive: '2026-10-02T03:00:00.000Z',
    });
  });

  it('mostra a data de reserva sem recuar um dia', () => {
    expect(format(parseCalendarDate('2026-10-01'), 'dd/MM/yyyy')).toBe('01/10/2026');
  });
});
