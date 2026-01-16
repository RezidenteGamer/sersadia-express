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

const statusConfig: Record<ReservationStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  confirmed: {
    label: 'Confirmada',
    className: 'bg-success/10 text-success border-success/20',
  },
  rejected: {
    label: 'Recusada',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  cancelled_by_user: {
    label: 'Cancelada',
    className: 'bg-muted text-muted-foreground border-muted',
  },
  cancelled_by_admin: {
    label: 'Cancelada (Admin)',
    className: 'bg-muted text-muted-foreground border-muted',
  },
  expired: {
    label: 'Expirada',
    className: 'bg-muted text-muted-foreground border-muted',
  },
  presence_confirmed: {
    label: 'Presença Confirmada',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}