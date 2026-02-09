import { useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, MapPin, Calendar, Users, Settings,
  CreditCard, UserCheck, Image, BarChart3
} from 'lucide-react';
import { useDesktopManager, DesktopApp } from './useDesktopManager';
import { DesktopWindow } from './DesktopWindow';
import { DesktopTaskbar } from './DesktopTaskbar';
import { DesktopIcon } from './DesktopIcon';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

import { AdminDashboardContent } from '@/pages/admin/AdminDashboard';
import { AdminLocationsContent } from '@/pages/admin/AdminLocations';
import { AdminReservationsContent } from '@/pages/admin/AdminReservations';
import { AdminUsersContent } from '@/pages/admin/AdminUsers';
import { AdminPaymentsContent } from '@/pages/admin/AdminPayments';
import { AdminCheckinContent } from '@/pages/admin/AdminCheckin';
import { AdminReportsContent } from '@/pages/admin/AdminReports';
import { AdminMembersContent } from '@/pages/admin/AdminMembers';
import { AdminBannersContent } from '@/pages/admin/AdminBanners';

const ALL_APPS: (DesktopApp & { permission?: string; adminOnly?: boolean })[] = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, component: AdminDashboardContent, adminOnly: true },
  { id: 'locations', title: 'Locais', icon: MapPin, component: AdminLocationsContent, permission: 'manage_locations' },
  { id: 'reservations', title: 'Reservas', icon: Calendar, component: AdminReservationsContent, permission: 'manage_reservations' },
  { id: 'members', title: 'Sócios', icon: Users, component: AdminMembersContent, permission: 'manage_users' },
  { id: 'users', title: 'Usuários', icon: Settings, component: AdminUsersContent, permission: 'manage_users' },
  { id: 'payments', title: 'Pagamentos', icon: CreditCard, component: AdminPaymentsContent, permission: 'manage_payments' },
  { id: 'checkin', title: 'Check-in', icon: UserCheck, component: AdminCheckinContent, permission: 'manage_checkin' },
  { id: 'banners', title: 'Banners', icon: Image, component: AdminBannersContent, adminOnly: true },
  { id: 'reports', title: 'Relatórios', icon: BarChart3, component: AdminReportsContent, permission: 'view_reports' },
];

const STORAGE_KEY = 'admin-desktop-icon-positions';

function loadIconPositions(): Record<string, { col: number; row: number }> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveIconPositions(positions: Record<string, { col: number; row: number }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function AdminDesktop() {
  const { isAdmin, permissions } = useAuth();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iconPositions, setIconPositions] = useState<Record<string, { col: number; row: number }>>(loadIconPositions);

  const {
    windows, activeWindowId, openWindow, closeWindow, minimizeWindow,
    toggleMaximize, snapWindow, focusWindow, updatePosition, updateSize,
    toggleMinimizeFromTaskbar, cycleWindows, closeActiveWindow,
  } = useDesktopManager();

  const availableApps = useMemo(() => {
    return ALL_APPS.filter(app => {
      if (app.adminOnly) return isAdmin;
      if (app.permission) return isAdmin || permissions.includes(app.permission);
      return true;
    });
  }, [isAdmin, permissions]);

  // Assign default grid positions to apps that don't have saved positions
  const resolvedPositions = useMemo(() => {
    const result: Record<string, { col: number; row: number }> = { ...iconPositions };
    let nextCol = 0;
    let nextRow = 0;
    availableApps.forEach(app => {
      if (!result[app.id]) {
        // Find next free slot
        while (Object.values(result).some(p => p.col === nextCol && p.row === nextRow)) {
          nextCol++;
          if (nextCol > 7) { nextCol = 0; nextRow++; }
        }
        result[app.id] = { col: nextCol, row: nextRow };
        nextCol++;
        if (nextCol > 7) { nextCol = 0; nextRow++; }
      }
    });
    return result;
  }, [availableApps, iconPositions]);

  const occupiedCells = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(resolvedPositions).forEach(([appId, pos]) => {
      map.set(`${pos.col}-${pos.row}`, appId);
    });
    return map;
  }, [resolvedPositions]);

  const handleIconPositionChange = useCallback((appId: string, pos: { col: number; row: number }) => {
    setIconPositions(prev => {
      const next = { ...prev, [appId]: pos };
      saveIconPositions(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useKeyboardShortcuts({
    onCycleWindows: cycleWindows,
    onCloseActiveWindow: closeActiveWindow,
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onToggleFullscreen: toggleFullscreen,
  });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Desktop Area */}
      <div
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-background) / 0.85) 40%, hsl(var(--primary) / 0.12) 100%)',
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        {/* Desktop Icons */}
        {availableApps.map(app => (
          <DesktopIcon
            key={app.id}
            icon={app.icon}
            label={app.title}
            appId={app.id}
            gridPosition={resolvedPositions[app.id] || { col: 0, row: 0 }}
            onOpen={() => openWindow(app)}
            onPositionChange={handleIconPositionChange}
            occupiedCells={occupiedCells}
          />
        ))}

        {/* Floating Windows */}
        {windows.map(win => (
          <DesktopWindow
            key={win.id}
            window={win}
            isActive={win.id === activeWindowId}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onToggleMaximize={() => toggleMaximize(win.id)}
            onFocus={() => focusWindow(win.id)}
            onUpdatePosition={(pos) => updatePosition(win.id, pos)}
            onUpdateSize={(size) => updateSize(win.id, size)}
            onSnap={(snap) => snapWindow(win.id, snap)}
            containerRef={desktopRef}
          />
        ))}
      </div>

      {/* Taskbar */}
      <DesktopTaskbar
        windows={windows}
        activeWindowId={activeWindowId}
        onToggleWindow={toggleMinimizeFromTaskbar}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        apps={availableApps}
        onSelectApp={openWindow}
      />
    </div>
  );
}
