import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { WindowState } from './useDesktopManager';

interface DesktopTaskbarProps {
  windows: WindowState[];
  onToggleWindow: (id: string) => void;
}

export function DesktopTaskbar({ windows, onToggleWindow }: DesktopTaskbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-11 bg-sidebar/95 backdrop-blur border-t border-sidebar-border flex items-center px-2 gap-1 shrink-0">
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {windows.map(win => {
          const Icon = win.icon;
          const maxZ = Math.max(...windows.map(w => w.zIndex));
          const isActive = !win.isMinimized && win.zIndex === maxZ;

          return (
            <button
              key={win.id}
              onClick={() => onToggleWindow(win.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors max-w-[180px] truncate",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : win.isMinimized
                    ? "bg-sidebar-accent/40 text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
                    : "bg-sidebar-accent/60 text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{win.title}</span>
            </button>
          );
        })}
      </div>
      <div className="text-xs text-sidebar-foreground/70 px-2 font-mono shrink-0">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
