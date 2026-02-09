import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Search, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WindowState } from './useDesktopManager';

interface DesktopTaskbarProps {
  windows: WindowState[];
  activeWindowId: string | null;
  onToggleWindow: (id: string) => void;
  onOpenCommandPalette: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
}

function TaskbarWindowButton({
  win,
  isActive,
  onToggle,
}: {
  win: WindowState;
  isActive: boolean;
  onToggle: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();
  const Icon = win.icon;

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setShowPreview(true), 400);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setShowPreview(false);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        onClick={onToggle}
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all max-w-[180px]",
          isActive
            ? "bg-white/20 text-white shadow-inner"
            : win.isMinimized
              ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{win.title}</span>
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
          isActive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : win.isMinimized ? "bg-white/20" : "bg-white/40"
        )} />
      </button>

      {/* Preview tooltip */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] pointer-events-none"
          >
            <div className="bg-popover/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl p-3 min-w-[200px] max-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{win.title}</span>
              </div>
              <div className="w-full h-28 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center overflow-hidden">
                <div className="text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <Icon className="w-8 h-8 text-muted-foreground/40" />
                  <span>{win.isMinimized ? 'Minimizada' : 'Em execução'}</span>
                </div>
              </div>
              {win.isSnapped && (
                <div className="mt-1.5 text-[10px] text-muted-foreground">
                  Encaixada: {win.isSnapped}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DesktopTaskbar({ windows, activeWindowId, onToggleWindow, onOpenCommandPalette, unreadCount, onOpenNotifications }: DesktopTaskbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-12 bg-sidebar/90 backdrop-blur-xl border-t border-white/10 flex items-center px-2 gap-1 shrink-0">
      {/* Search/Command button */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors mr-1"
        title="Ctrl+P"
      >
        <Search className="w-3.5 h-3.5" />
      </button>

      {/* Window buttons */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {windows.map(win => (
          <TaskbarWindowButton
            key={win.id}
            win={win}
            isActive={win.id === activeWindowId && !win.isMinimized}
            onToggle={() => onToggleWindow(win.id)}
          />
        ))}
      </div>

      {/* System tray */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Notifications bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg animate-scale-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Clock + Date */}
        <div className="flex flex-col items-end px-2 leading-tight">
          <span className="text-xs text-white/80 font-mono">{timeStr}</span>
          <span className="text-[10px] text-white/50 capitalize">{dateStr}</span>
        </div>
      </div>
    </div>
  );
}
