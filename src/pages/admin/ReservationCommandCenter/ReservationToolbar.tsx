import { useState } from 'react';
import { Search, Download, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { StatusFilter, QuickFilter } from './types';
import type { Tables } from '@/integrations/supabase/types';
import { exportToCSV } from '@/lib/exportReport';
import type { ReservationWithDetails } from './types';
import type { DateRange } from 'react-day-picker';

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  quickFilter: QuickFilter | null;
  onQuickFilterChange: (v: QuickFilter | null) => void;
  locationFilter: string;
  onLocationChange: (v: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  locations: Pick<Tables<'locations'>, 'id' | 'name'>[] | undefined;
  stats: { total: number; pending: number; totalReceivable: number; refundPending: number };
  filtered: ReservationWithDetails[];
}

const STATUS_PILLS: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Todas', color: 'bg-muted text-foreground' },
  { value: 'pending', label: 'Pendentes', color: 'bg-warning/15 text-warning' },
  { value: 'confirmed', label: 'Confirmadas', color: 'bg-success/15 text-success' },
  { value: 'cancelled', label: 'Canceladas', color: 'bg-destructive/15 text-destructive' },
  { value: 'expired', label: 'Expiradas', color: 'bg-muted text-muted-foreground' },
];

const QUICK_PILLS: { value: QuickFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'awaiting_receipt', label: 'Aguardando comprovante' },
  { value: 'refund_pending', label: 'Reembolso pendente' },
];

export function ReservationToolbar({
  search, onSearchChange,
  statusFilter, onStatusChange,
  quickFilter, onQuickFilterChange,
  locationFilter, onLocationChange,
  dateRange, onDateRangeChange,
  locations,
  stats,
  filtered,
}: ToolbarProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const handleExport = () => {
    exportToCSV(
      filtered.map(r => ({
        code: r.code,
        user: r.user_profile?.full_name || '',
        email: r.user_profile?.email || '',
        location: r.location?.name || '',
        date: r.reservation_date,
        start: r.start_time,
        end: r.end_time,
        value: r.total_price.toFixed(2),
        status: r.status,
        refund_status: r.refund_status,
      })),
      [
        { key: 'code', label: 'Código' },
        { key: 'user', label: 'Usuário' },
        { key: 'email', label: 'Email' },
        { key: 'location', label: 'Local' },
        { key: 'date', label: 'Data' },
        { key: 'start', label: 'Início' },
        { key: 'end', label: 'Fim' },
        { key: 'value', label: 'Valor' },
        { key: 'status', label: 'Status' },
        { key: 'refund_status', label: 'Reembolso' },
      ],
      `reservas-${new Date().toISOString().split('T')[0]}`
    );
  };

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, 'dd/MM')} – ${format(dateRange.to, 'dd/MM')}`
      : format(dateRange.from, 'dd/MM/yyyy')
    : 'Período';

  return (
    <div className="space-y-3 p-4 border-b border-border/50">
      {/* Row 1: Search + Location + Date Range + Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, usuário ou local…"
            className="pl-9 h-9 text-sm bg-background/50"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            data-search-input
          />
        </div>
        <Select value={locationFilter} onValueChange={onLocationChange}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Todos os locais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os locais</SelectItem>
            {locations?.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range picker */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-9 text-sm gap-2 font-normal min-w-[140px] justify-start',
                !dateRange?.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range);
                // Close popover when both dates are selected
                if (range?.from && range?.to) {
                  setTimeout(() => setDatePopoverOpen(false), 200);
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {dateRange?.from && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => onDateRangeChange(undefined)}
            title="Limpar período"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExport} title="Exportar CSV">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Row 2: Status pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_PILLS.map(pill => (
          <button
            key={pill.value}
            onClick={() => { onStatusChange(pill.value); onQuickFilterChange(null); }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold transition-all border',
              statusFilter === pill.value && !quickFilter
                ? cn(pill.color, 'border-current ring-1 ring-current/20')
                : 'bg-transparent text-muted-foreground border-border/50 hover:bg-muted/50'
            )}
          >
            {pill.label}
          </button>
        ))}
        <span className="w-px h-5 bg-border/50 mx-1" />
        {QUICK_PILLS.map(pill => (
          <button
            key={pill.value}
            onClick={() => {
              if (quickFilter === pill.value) {
                onQuickFilterChange(null);
              } else {
                onQuickFilterChange(pill.value);
                onStatusChange('all');
              }
            }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all border',
              quickFilter === pill.value
                ? 'bg-primary/15 text-primary border-primary/30 ring-1 ring-primary/20'
                : 'bg-transparent text-muted-foreground border-border/50 hover:bg-muted/50'
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>📅 {stats.total} reservas</span>
        <span className="text-border">|</span>
        <span>⏳ {stats.pending} pendentes</span>
        <span className="text-border">|</span>
        <span>💰 R$ {stats.totalReceivable.toFixed(2)} a receber</span>
        <span className="text-border">|</span>
        <span>↩️ {stats.refundPending} reembolsos pendentes</span>
      </div>
    </div>
  );
}
