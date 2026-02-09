import { useState } from 'react';
import { LucideIcon, ArrowLeft, Bell, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { DesktopApp } from './useDesktopManager';

interface AdminMobileViewProps {
  apps: (DesktopApp & { permission?: string; adminOnly?: boolean })[];
  unreadCount: number;
  onOpenNotifications: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function AdminMobileView({ apps, unreadCount, onOpenNotifications, isDark, onToggleTheme }: AdminMobileViewProps) {
  const [activeApp, setActiveApp] = useState<DesktopApp | null>(null);

  if (activeApp) {
    const ContentComponent = activeApp.component;
    const Icon = activeApp.icon;
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Mobile App Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-sidebar text-white shrink-0 safe-area-top">
          <button onClick={() => setActiveApp(null)} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{activeApp.title}</span>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <ContentComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-sidebar text-white shrink-0 safe-area-top">
        <h1 className="text-lg font-semibold">Administração</h1>
        <div className="flex items-center gap-1">
          <button onClick={onToggleTheme} className="p-2 rounded-lg hover:bg-white/15 transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onOpenNotifications} className="relative p-2 rounded-lg hover:bg-white/15 transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* App Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-3 gap-3">
          {apps.map(app => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => setActiveApp(app)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors",
                  "bg-card border border-border hover:bg-accent active:scale-95"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-sidebar/90 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{app.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
