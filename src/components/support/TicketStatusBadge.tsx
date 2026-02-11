import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  waiting: { label: 'Aguardando', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'Em Atendimento', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolvido', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Fechado', className: 'bg-muted text-muted-foreground' },
};

export function TicketStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.waiting;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
