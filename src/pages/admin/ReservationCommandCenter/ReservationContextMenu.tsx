import { useEffect, useRef, useCallback } from 'react';
import { Check, X, Ban, UserCheck, Image as ImageIcon, Clipboard, Eye, RefreshCw, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/native';
import type { ReservationWithDetails } from './types';

interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  reservation: ReservationWithDetails | null;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function ReservationContextMenu({ open, x, y, reservation, onClose, onAction }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open || !reservation) return null;

  const r = reservation;
  const hasReceipt = !!r.payment?.receipt_url;
  const isPending = r.status === 'pending';
  const isConfirmed = r.status === 'confirmed';
  const isCancelled = ['cancelled_by_user', 'cancelled_by_admin'].includes(r.status);
  const isRefundPending = isCancelled && (r.refund_status === 'pending' || r.refund_status === 'none');
  const isExpired = r.status === 'expired';
  const today = new Date().toISOString().split('T')[0];
  const isToday = r.reservation_date === today;

  const items: (ContextMenuItem | 'separator')[] = [];

  if (isPending) {
    items.push({ label: 'Confirmar pagamento', icon: <Check className="w-4 h-4" />, shortcut: 'P', onClick: () => onAction('payment') });
    items.push({
      label: 'Ver comprovante',
      icon: <ImageIcon className="w-4 h-4" />,
      onClick: () => onAction('receipt'),
      disabled: !hasReceipt,
      tooltip: !hasReceipt ? 'Nenhum comprovante enviado' : undefined,
    });
    items.push({ label: 'Recusar reserva', icon: <X className="w-4 h-4" />, onClick: () => onAction('reject'), danger: true });
    items.push({ label: 'Cancelar reserva', icon: <Ban className="w-4 h-4" />, onClick: () => onAction('cancel'), danger: true });
    items.push('separator');
    items.push({ label: 'Copiar código', icon: <Clipboard className="w-4 h-4" />, shortcut: 'C', onClick: () => copyToClipboard(r.code, 'Código') });
  } else if (isConfirmed) {
    if (isToday) {
      items.push({ label: 'Fazer check-in', icon: <UserCheck className="w-4 h-4" />, onClick: () => onAction('checkin') });
    }
    items.push({ label: 'Cancelar reserva', icon: <Ban className="w-4 h-4" />, onClick: () => onAction('cancel'), danger: true });
    items.push('separator');
    items.push({ label: 'Copiar código', icon: <Clipboard className="w-4 h-4" />, shortcut: 'C', onClick: () => copyToClipboard(r.code, 'Código') });
    if (hasReceipt) {
      items.push({ label: 'Ver comprovante', icon: <ImageIcon className="w-4 h-4" />, onClick: () => onAction('receipt') });
    }
  } else if (isCancelled && isRefundPending) {
    items.push({ label: 'Aprovar reembolso', icon: <RefreshCw className="w-4 h-4" />, shortcut: 'R', onClick: () => onAction('refund') });
    items.push({ label: 'Adicionar observação', icon: <MessageSquare className="w-4 h-4" />, onClick: () => onAction('notes') });
    items.push('separator');
    items.push({ label: 'Copiar código', icon: <Clipboard className="w-4 h-4" />, shortcut: 'C', onClick: () => copyToClipboard(r.code, 'Código') });
  } else {
    items.push({ label: 'Copiar código', icon: <Clipboard className="w-4 h-4" />, shortcut: 'C', onClick: () => copyToClipboard(r.code, 'Código') });
    items.push({ label: 'Ver detalhes', icon: <Eye className="w-4 h-4" />, onClick: () => onAction('view') });
  }

  // Clamp position to viewport
  const menuWidth = 240;
  const menuHeight = items.length * 36 + 16;
  const posX = Math.min(x, window.innerWidth - menuWidth - 8);
  const posY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[220px] bg-popover/95 backdrop-blur-lg border border-border/50 rounded-[10px] shadow-2xl py-1 animate-in fade-in-0 zoom-in-95"
      style={{ left: posX, top: posY }}
      onMouseDown={e => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item === 'separator') {
          return <div key={`sep-${i}`} className="h-px bg-border/50 my-1 mx-2" />;
        }
        return (
          <button
            key={item.label}
            onClick={() => { item.onClick(); onClose(); }}
            disabled={item.disabled}
            title={item.tooltip}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
              item.disabled
                ? 'opacity-40 cursor-not-allowed'
                : item.danger
                  ? 'hover:bg-destructive/10 text-destructive'
                  : 'hover:bg-accent',
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-muted-foreground font-mono">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
