import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import type { WindowState } from './useDesktopManager';

interface DesktopTaskbarProps {
  windows: WindowState[];
  activeWindowId: string | null;
  onToggleWindow: (id: string) => void;
  onOpenCommandPalette: () => void;
}

export function DesktopTaskbar({ windows, activeWindowId, onToggleWindow, onOpenCommandPalette }: DesktopTaskbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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
        {windows.map(win => {
          const Icon = win.icon;
          const isActive = win.id === activeWindowId && !win.isMinimized;

          return (
            <button
              key={win.id}
              onClick={() => onToggleWindow(win.id)}
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
              {/* Active indicator dot */}
              <span className={cn(
                "w-1 h-1 rounded-full shrink-0 transition-colors",
                isActive ? "bg-green-400" : win.isMinimized ? "bg-white/20" : "bg-white/40"
              )} />
            </button>
          );
        })}
      </div>

      {/* Clock */}
      <div className="text-xs text-white/60 px-3 font-mono shrink-0">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
