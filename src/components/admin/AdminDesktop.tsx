import { useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, MapPin, Calendar, Users, Settings,
  CreditCard, UserCheck, Image, BarChart3, FolderOpen, Trash2, ExternalLink
} from 'lucide-react';
import { useDesktopManager, DesktopApp } from './useDesktopManager';
import { DesktopWindow } from './DesktopWindow';
import { DesktopTaskbar } from './DesktopTaskbar';
import { DesktopIcon } from './DesktopIcon';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { DesktopContextMenu } from './DesktopContextMenu';
import { ClockWidget, StatusWidget } from './DesktopWidgets';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications, useUnreadNotificationsCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

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

// Badge mapping: which apps get notification badges
const BADGE_APP_IDS = ['reservations', 'payments'];

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
  const [iconPositions, setIconPositions] = useState<Record<string, { col: number; row: number }>>(loadIconPositions);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; appId: string | null }>({
    open: false, x: 0, y: 0, appId: null,
  });

  // Notifications
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

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

  const resolvedPositions = useMemo(() => {
    const result: Record<string, { col: number; row: number }> = { ...iconPositions };
    let nextCol = 0;
    let nextRow = 0;
    availableApps.forEach(app => {
      if (!result[app.id]) {
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
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Context menu handlers
  const handleIconContextMenu = useCallback((appId: string, x: number, y: number) => {
    setContextMenu({ open: true, x, y, appId });
  }, []);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, appId: null });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const contextMenuItems = useMemo(() => {
    if (contextMenu.appId) {
      const app = availableApps.find(a => a.id === contextMenu.appId);
      if (!app) return [];
      const isOpen = windows.some(w => w.id === app.id);
      return [
        { label: 'Abrir', icon: <FolderOpen className="w-4 h-4" />, onClick: () => openWindow(app) },
        ...(isOpen ? [{ label: 'Fechar', icon: <Trash2 className="w-4 h-4" />, onClick: () => closeWindow(app.id), danger: true, divider: true }] : []),
        { label: 'Resetar posição', icon: <ExternalLink className="w-4 h-4" />, onClick: () => handleIconPositionChange(app.id, { col: 0, row: 0 }), divider: !isOpen },
      ];
    }
    // Desktop context menu
    return [
      { label: 'Command Palette', icon: <ExternalLink className="w-4 h-4" />, onClick: () => setCommandPaletteOpen(true) },
      { label: 'Tela cheia', icon: <ExternalLink className="w-4 h-4" />, onClick: toggleFullscreen },
      { label: 'Resetar ícones', icon: <ExternalLink className="w-4 h-4" />, onClick: () => { setIconPositions({}); localStorage.removeItem(STORAGE_KEY); }, divider: true },
    ];
  }, [contextMenu.appId, availableApps, windows, openWindow, closeWindow, handleIconPositionChange, toggleFullscreen]);

  useKeyboardShortcuts({
    onCycleWindows: cycleWindows,
    onCloseActiveWindow: closeActiveWindow,
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onToggleFullscreen: toggleFullscreen,
  });

  const activeAppTitle = useMemo(() => {
    if (!activeWindowId) return null;
    const w = windows.find(w => w.id === activeWindowId);
    return w?.title || null;
  }, [activeWindowId, windows]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Desktop Area */}
      <div
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
        onContextMenu={handleDesktopContextMenu}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-background) / 0.85) 40%, hsl(var(--primary) / 0.12) 100%)',
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
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
            badge={BADGE_APP_IDS.includes(app.id) ? undefined : undefined}
            onOpen={() => openWindow(app)}
            onPositionChange={handleIconPositionChange}
            occupiedCells={occupiedCells}
            onContextMenu={handleIconContextMenu}
          />
        ))}

        {/* Widgets (only visible when no windows cover them) */}
        <div className="pointer-events-none absolute inset-0">
          <ClockWidget />
          <StatusWidget windowCount={windows.length} activeApp={activeAppTitle} />
        </div>

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
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationsOpen(prev => !prev)}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        apps={availableApps}
        onSelectApp={openWindow}
      />

      {/* Context Menu */}
      <DesktopContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />

      {/* Notification Panel */}
      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => markAsRead.mutate(id)}
        onMarkAllAsRead={() => markAllAsRead.mutate()}
      />
    </div>
  );
}
