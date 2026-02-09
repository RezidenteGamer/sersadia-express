import { useMemo } from 'react';
import { X, Minus, Square, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WindowState } from './useDesktopManager';

interface TaskManagerContentProps {
  windows: WindowState[];
  onFocusWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onMinimizeWindow: (id: string) => void;
}

export function TaskManagerContent({ windows, onFocusWindow, onCloseWindow, onMinimizeWindow }: TaskManagerContentProps) {
  const stats = useMemo(() => ({
    total: windows.length,
    active: windows.filter(w => !w.isMinimized).length,
    minimized: windows.filter(w => w.isMinimized).length,
  }), [windows]);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-xl p-4 border border-border/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <span className="text-2xl font-semibold text-foreground">{stats.total}</span>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 border border-border/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Square className="w-4 h-4" />
            <span className="text-xs font-medium">Ativas</span>
          </div>
          <span className="text-2xl font-semibold text-foreground">{stats.active}</span>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 border border-border/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Minus className="w-4 h-4" />
            <span className="text-xs font-medium">Minimizadas</span>
          </div>
          <span className="text-2xl font-semibold text-foreground">{stats.minimized}</span>
        </div>
      </div>

      {/* Process list */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Processos em execução</h3>
        {windows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma janela aberta
          </div>
        ) : (
          <div className="space-y-1.5">
            {windows.map(win => {
              const Icon = win.icon;
              return (
                <div
                  key={win.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
                    win.isMinimized
                      ? "bg-muted/30 border-border/20"
                      : "bg-muted/50 border-border/30"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{win.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        win.isMinimized
                          ? "bg-muted text-muted-foreground"
                          : win.isMaximized
                            ? "bg-primary/10 text-primary"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          win.isMinimized ? "bg-muted-foreground/40" : "bg-emerald-500"
                        )} />
                        {win.isMinimized ? 'Minimizada' : win.isMaximized ? 'Maximizada' : 'Ativa'}
                      </span>
                      {win.isSnapped && (
                        <span className="text-[10px] text-muted-foreground">
                          Snap: {win.isSnapped}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onFocusWindow(win.id)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      title="Focar"
                    >
                      <Square className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => onMinimizeWindow(win.id)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      title="Minimizar"
                    >
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => onCloseWindow(win.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      title="Fechar"
                    >
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
