import { useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar } from 'lucide-react';
import type { ReservationWithDetails } from './types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-l-warning',
  confirmed: 'border-l-success',
  presence_confirmed: 'border-l-success',
  rejected: 'border-l-destructive',
  cancelled_by_user: 'border-l-destructive/60',
  cancelled_by_admin: 'border-l-muted-foreground',
  expired: 'border-l-muted-foreground/50',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  presence_confirmed: 'Presença',
  rejected: 'Recusada',
  cancelled_by_user: 'Cancelada',
  cancelled_by_admin: 'Cancelada',
  expired: 'Expirada',
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  confirmed: 'bg-success/15 text-success',
  presence_confirmed: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  cancelled_by_user: 'bg-destructive/10 text-destructive/70',
  cancelled_by_admin: 'bg-muted text-muted-foreground',
  expired: 'bg-muted text-muted-foreground',
};

interface ReservationListProps {
  reservations: ReservationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  onContextMenu?: (reservation: ReservationWithDetails, x: number, y: number) => void;
}

export function ReservationList({ reservations, selectedId, onSelect, isLoading, onContextMenu }: ReservationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <EmptyState
          icon={Calendar}
          title="Nenhuma reserva"
          description="Nenhuma reserva encontrada com os filtros selecionados"
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border/30">
        {reservations.map(r => {
          const isSelected = r.id === selectedId;
          const hasUnreviewedReceipt = r.status === 'pending' && r.payment?.receipt_url && !r.payment?.is_paid;

          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu?.(r, e.clientX, e.clientY);
              }}
              className={cn(
                'w-full text-left px-4 py-3 transition-all duration-150 border-l-[3px] group relative',
                STATUS_COLORS[r.status] || 'border-l-muted',
                isSelected
                  ? 'bg-accent/60 border-l-[4px]'
                  : 'hover:bg-accent/30',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Code + Receipt indicator */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[11px] text-muted-foreground">{r.code}</span>
                  {hasUnreviewedReceipt && (
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" title="Comprovante não revisado" />
                  )}
                </div>

                {/* User + Space */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{r.user_profile?.full_name || 'Sem nome'}</p>
                  <p className="text-[11px] text-muted-foreground truncate italic">
                    {r.location?.name}
                  </p>
                </div>

                {/* Date + Value */}
                <div className="text-right shrink-0">
                  <p className="text-[12px] text-muted-foreground">
                    {format(new Date(r.reservation_date + 'T00:00:00'), 'dd/MM')} · {r.start_time.substring(0, 5)}–{r.end_time.substring(0, 5)}
                  </p>
                  <p className="text-[13px] font-semibold">R$ {r.total_price.toFixed(2)}</p>
                </div>

                {/* Status badge */}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0',
                  STATUS_BADGE_COLORS[r.status] || 'bg-muted text-muted-foreground'
                )}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">›</span>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
