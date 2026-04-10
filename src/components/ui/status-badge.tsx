import { cn } from '@/lib/utils';

type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'rejected' 
  | 'cancelled_by_user' 
  | 'cancelled_by_admin' 
  | 'expired' 
  | 'presence_confirmed';

interface StatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

const statusConfig: Record<ReservationStatus, { label: string; icon: string; className: string }> = {
  pending: {
    label: 'Pendente',
    icon: '⏱',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  confirmed: {
    label: 'Confirmada',
    icon: '✓',
    className: 'bg-success/10 text-success border-success/20',
  },
  rejected: {
    label: 'Recusada',
    icon: '✕',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  cancelled_by_user: {
    label: 'Cancelada',
    icon: '✕',
    className: 'bg-primary/8 text-primary border-primary/15',
  },
  cancelled_by_admin: {
    label: 'Cancelada (Admin)',
    icon: '✕',
    className: 'bg-muted text-muted-foreground border-border',
  },
  expired: {
    label: 'Expirada',
    icon: '—',
    className: 'bg-muted text-muted-foreground border-border',
  },
  presence_confirmed: {
    label: 'Presença Confirmada',
    icon: '✓',
    className: 'bg-success/10 text-success border-success/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border",
        config.className,
        className
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
