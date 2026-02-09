import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationPanel({ open, onClose, notifications, onMarkAsRead, onMarkAllAsRead }: NotificationPanelProps) {
  const unread = notifications.filter(n => !n.is_read);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-14 right-4 z-[9999] w-[360px] max-h-[480px] bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Notificações</span>
                {unread.length > 0 && (
                  <span className="text-[10px] bg-destructive text-white px-1.5 py-0.5 rounded-full font-bold">
                    {unread.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread.length > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-primary hover:underline mr-2"
                  >
                    Marcar todas
                  </button>
                )}
                <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-sm">Sem notificações</span>
                </div>
              ) : (
                notifications.slice(0, 30).map(n => (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && onMarkAsRead(n.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-border/20 transition-colors",
                      n.is_read
                        ? "bg-transparent hover:bg-muted/30"
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        n.is_read ? "bg-muted-foreground/20" : "bg-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm leading-tight", !n.is_read && "font-medium")}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {format(new Date(n.created_at), "dd MMM · HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
