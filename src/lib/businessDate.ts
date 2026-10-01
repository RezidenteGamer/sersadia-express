import { format, parseISO } from 'date-fns';

const businessZone = 'America/Sao_Paulo';
const zonedFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: businessZone,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function businessDateKey(instant: Date = new Date()): string {
  const parts = Object.fromEntries(zonedFormatter.formatToParts(instant).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function calendarDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseCalendarDate(dateKey: string): Date {
  return parseISO(dateKey);
}

export function businessDayStart(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const desired = Date.UTC(year, month - 1, day);
  let instant = desired;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(zonedFormatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    const displayedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second));
    const corrected = instant + desired - displayedAsUtc;
    if (corrected === instant) break;
    instant = corrected;
  }
  return new Date(instant);
}

export function businessDayRange(dateFrom: Date, dateTo: Date) {
  const end = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate() + 1);
  return {
    start: businessDayStart(calendarDateKey(dateFrom)).toISOString(),
    endExclusive: businessDayStart(calendarDateKey(end)).toISOString(),
  };
}
