import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Check, CheckCheck, AlertCircle, Calendar, XCircle, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function getNotificationType(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('confirm') || lower.includes('aprov')) return 'approved';
  if (lower.includes('cancel') || lower.includes('recus') || lower.includes('rejeit')) return 'cancelled';
  if (lower.includes('penden') || lower.includes('aguard')) return 'pending';
  if (lower.includes('check')) return 'checkin';
  return 'default';
}

const typeConfig = {
  approved: { icon: Check, bg: 'bg-success/10', color: 'text-success' },
  cancelled: { icon: XCircle, bg: 'bg-primary/10', color: 'text-primary' },
  pending: { icon: AlertCircle, bg: 'bg-warning/10', color: 'text-warning' },
  checkin: { icon: QrCode, bg: 'bg-accent', color: 'text-foreground' },
  default: { icon: Bell, bg: 'bg-accent', color: 'text-foreground' },
};

function formatDateGroup(date: Date): string {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "dd 'de' MMMM", { locale: ptBR });
}

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  if (isLoading) {
    return <AppLayout><LoadingSpinner /></AppLayout>;
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Group by date
  const groups: Record<string, typeof notifications> = {};
  notifications?.forEach(n => {
    const key = formatDateGroup(new Date(n.created_at));
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(n);
  });

  return (
    <AppLayout>
      <PageHeader
        title="Notificações"
        description="Suas notificações e atualizações"
        action={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {!notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Você não tem notificações no momento" />
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <motion.div
                className="space-y-2"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {items?.map((notification) => {
                  const type = getNotificationType(notification.title);
                  const config = typeConfig[type];
                  const IconComp = config.icon;

                  return (
                    <motion.div
                      key={notification.id}
                      variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                    >
                      <Card className={cn(
                        "transition-colors rounded-xl",
                        !notification.is_read && "border-l-[3px] border-l-primary bg-primary/[0.02]"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.bg)}>
                              <IconComp className={cn("w-5 h-5", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-sm text-foreground">{notification.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                                </div>
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                  {format(new Date(notification.created_at), "HH:mm")}
                                </span>
                              </div>
                            </div>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => markAsRead.mutate(notification.id)}
                                disabled={markAsRead.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
