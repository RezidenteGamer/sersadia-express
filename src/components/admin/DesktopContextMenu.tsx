import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface DesktopContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function DesktopContextMenu({ open, x, y, items, onClose }: DesktopContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use capture phase to close before other handlers
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Adjust position to stay within viewport
  const adjustedX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - 200) : x;
  const adjustedY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - items.length * 36 - 16) : y;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[99999] min-w-[180px] py-1.5 bg-popover/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl"
          style={{ left: adjustedX, top: adjustedY }}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className="h-px bg-border/40 my-1 mx-2" />}
              <button
                onClick={() => { item.onClick(); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left",
                  item.danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
