import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard, MapPin, Users, Settings,
  UserCheck, Image, BarChart3, FolderOpen, Trash2,
  ExternalLink, Paintbrush, Volume2, VolumeX, Activity, Maximize, Sun, Moon, Headset, FileText, DollarSign, QrCode, CalendarCheck2
} from 'lucide-react';

import iconDashboard from '@/assets/admin-icons/dashboard.png';
import iconLocations from '@/assets/admin-icons/locations.png';
import iconReservations from '@/assets/admin-icons/reservations.png';
import iconMembers from '@/assets/admin-icons/members.png';
import iconCheckin from '@/assets/admin-icons/checkin.png';
import iconReports from '@/assets/admin-icons/reports.png';
import iconBanners from '@/assets/admin-icons/banners.png';
import iconFinancial from '@/assets/admin-icons/financial.png';
import iconSupport from '@/assets/admin-icons/support.png';
import iconDocs from '@/assets/admin-icons/docs.png';
import iconPix from '@/assets/admin-icons/pix.png';
import iconUsers from '@/assets/admin-icons/users.png';
import { useDesktopManager, DesktopApp } from './useDesktopManager';
import { DesktopWindow } from './DesktopWindow';
import { DesktopTaskbar } from './DesktopTaskbar';
import { DesktopIcon } from './DesktopIcon';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { DesktopContextMenu } from './DesktopContextMenu';
import { ClockWidget, StatusWidget } from './DesktopWidgets';
import { NotificationPanel } from './NotificationPanel';
import { WallpaperSettings } from './WallpaperSettings';
import { TaskManagerContent } from './TaskManagerContent';
import { useDesktopSounds, loadSoundsEnabled, saveSoundsEnabled } from './useDesktopSounds';
import { WallpaperConfig, loadWallpaper, saveWallpaper, getWallpaperStyle } from './wallpaperConfig';
import { useWallpaperSync } from '@/hooks/useWallpaperSync';
import { useNotifications, useUnreadNotificationsCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useDesktopTheme } from './useDesktopTheme';
import { AdminMobileView } from './AdminMobileView';
import { useAuth } from '@/contexts/AuthContext';

import { AdminDashboardContent } from '@/pages/admin/AdminDashboard';
import { AdminLocationsContent } from '@/pages/admin/AdminLocations';
import { AdminUsersContent } from '@/pages/admin/AdminUsers';
import { AdminCheckinContent } from '@/pages/admin/AdminCheckin';
import { AdminReportsContent } from '@/pages/admin/AdminReports';
import { AdminMembersContent } from '@/pages/admin/AdminMembers';
import { AdminBannersContent } from '@/pages/admin/AdminBanners';
import { AdminSupportContent } from '@/pages/admin/AdminSupport';
import { AdminDocsContent } from '@/pages/admin/AdminDocs';
import { AdminFinancialReportsContent } from '@/pages/admin/AdminFinancialReports';
import { AdminPixSettingsContent } from '@/pages/admin/AdminPixSettings';
import { ReservationCommandCenterContent } from '@/pages/admin/ReservationCommandCenter';

const ALL_APPS: (DesktopApp & { permission?: string; adminOnly?: boolean; defaultSize?: { width: number; height: number }; imageIcon?: string })[] = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, component: AdminDashboardContent, adminOnly: true, imageIcon: iconDashboard },
  { id: 'locations', title: 'Locais', icon: MapPin, component: AdminLocationsContent, permission: 'manage_locations', imageIcon: iconLocations },
  { id: 'reservation-center', title: 'Central de Reservas', icon: CalendarCheck2, component: ReservationCommandCenterContent, permission: 'manage_reservations', defaultSize: { width: 1100, height: 680 }, imageIcon: iconReservations },
  { id: 'members', title: 'Sócios', icon: Users, component: AdminMembersContent, permission: 'manage_members', imageIcon: iconMembers },
  { id: 'users', title: 'Usuários', icon: Settings, component: AdminUsersContent, permission: 'manage_users', imageIcon: iconUsers },
  { id: 'checkin', title: 'Check-in', icon: UserCheck, component: AdminCheckinContent, permission: 'manage_checkin', imageIcon: iconCheckin },
  { id: 'banners', title: 'Banners', icon: Image, component: AdminBannersContent, permission: 'manage_banners', imageIcon: iconBanners },
  { id: 'reports', title: 'Relatórios', icon: BarChart3, component: AdminReportsContent, permission: 'view_reports', imageIcon: iconReports },
  { id: 'financial-reports', title: 'Financeiro', icon: DollarSign, component: AdminFinancialReportsContent, permission: 'view_financial_reports', imageIcon: iconFinancial },
  { id: 'support', title: 'Suporte', icon: Headset, component: AdminSupportContent, permission: 'manage_support', imageIcon: iconSupport },
  { id: 'docs', title: 'Documentação', icon: FileText, component: AdminDocsContent, adminOnly: true, imageIcon: iconDocs },
  { id: 'pix-settings', title: 'Config. PIX', icon: QrCode, component: AdminPixSettingsContent, permission: 'manage_pix', imageIcon: iconPix },
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
  const isMobile = useIsMobile();
  const { isAdmin, permissions } = useAuth();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [iconPositions, setIconPositions] = useState<Record<string, { col: number; row: number }>>(loadIconPositions);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [wallpaperSettingsOpen, setWallpaperSettingsOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperConfig>(loadWallpaper);
  const [soundsEnabled, setSoundsEnabled] = useState(loadSoundsEnabled);
  const { theme, toggleTheme, isDark } = useDesktopTheme();
  const { dbWallpaper, saveAndSync, uploadWallpaperFile } = useWallpaperSync();

  // Sync wallpaper from DB on load
  useEffect(() => {
    if (dbWallpaper) setWallpaper(dbWallpaper);
  }, [dbWallpaper]);

  // Sounds
  const sounds = useDesktopSounds(soundsEnabled);

  const toggleSounds = useCallback(() => {
    setSoundsEnabled(prev => {
      const next = !prev;
      saveSoundsEnabled(next);
      return next;
    });
  }, []);

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

  // Wrap window actions with sounds
  const handleOpenWindow = useCallback((app: DesktopApp) => {
    sounds.playOpen();
    openWindow(app);
  }, [openWindow, sounds]);

  const handleCloseWindow = useCallback((id: string) => {
    sounds.playClose();
    closeWindow(id);
  }, [closeWindow, sounds]);

  const handleMinimizeWindow = useCallback((id: string) => {
    sounds.playMinimize();
    minimizeWindow(id);
  }, [minimizeWindow, sounds]);

  const availableApps = useMemo(() => {
    return ALL_APPS.filter(app => {
      if (app.adminOnly) return isAdmin;
      if (app.permission) return permissions.includes(app.permission);
      return true;
    });
  }, [isAdmin, permissions]);

  // Task Manager as a special "app"
  const TaskManagerWrapper = useCallback(() => (
    <TaskManagerContent
      windows={windows}
      onFocusWindow={focusWindow}
      onCloseWindow={handleCloseWindow}
      onMinimizeWindow={handleMinimizeWindow}
    />
  ), [windows, focusWindow, handleCloseWindow, handleMinimizeWindow]);

  const taskManagerApp: DesktopApp = useMemo(() => ({
    id: 'task-manager',
    title: 'Gerenciador de Tarefas',
    icon: Activity,
    component: TaskManagerWrapper,
  }), [TaskManagerWrapper]);

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

  const handleApplyWallpaper = useCallback((config: WallpaperConfig) => {
    setWallpaper(config);
    saveAndSync(config);
  }, [saveAndSync]);

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
        { label: 'Abrir', icon: <FolderOpen className="w-4 h-4" />, onClick: () => handleOpenWindow(app) },
        ...(isOpen ? [{ label: 'Fechar', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleCloseWindow(app.id), danger: true, divider: true }] : []),
        { label: 'Resetar posição', icon: <ExternalLink className="w-4 h-4" />, onClick: () => handleIconPositionChange(app.id, { col: 0, row: 0 }), divider: !isOpen },
      ];
    }
    return [
      { label: 'Command Palette', icon: <ExternalLink className="w-4 h-4" />, onClick: () => setCommandPaletteOpen(true) },
      { label: 'Gerenciador de Tarefas', icon: <Activity className="w-4 h-4" />, onClick: () => handleOpenWindow(taskManagerApp) },
      { label: 'Papel de Parede', icon: <Paintbrush className="w-4 h-4" />, onClick: () => setWallpaperSettingsOpen(true), divider: true },
      { label: soundsEnabled ? 'Desativar sons' : 'Ativar sons', icon: soundsEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />, onClick: toggleSounds },
      { label: isDark ? 'Tema claro' : 'Tema escuro', icon: isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, onClick: toggleTheme },
      { label: 'Tela cheia', icon: <Maximize className="w-4 h-4" />, onClick: toggleFullscreen, divider: true },
      { label: 'Resetar ícones', icon: <ExternalLink className="w-4 h-4" />, onClick: () => { setIconPositions({}); localStorage.removeItem(STORAGE_KEY); } },
    ];
  }, [contextMenu.appId, availableApps, windows, handleOpenWindow, handleCloseWindow, handleIconPositionChange, toggleFullscreen, taskManagerApp, soundsEnabled, toggleSounds, isDark, toggleTheme]);

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

  // All apps including task manager for command palette
  const allCommandApps = useMemo(() => [...availableApps, taskManagerApp], [availableApps, taskManagerApp]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        <AdminMobileView
          apps={availableApps}
          unreadCount={unreadCount}
          onOpenNotifications={() => setNotificationsOpen(prev => !prev)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
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

  return (
    <div className="flex flex-col h-full w-full">
      {/* Desktop Area */}
      <div
        ref={desktopRef}
        className="flex-1 relative overflow-hidden cursor-default"
        onContextMenu={handleDesktopContextMenu}
        style={getWallpaperStyle(wallpaper)}
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
            imageIcon={app.imageIcon}
            gridPosition={resolvedPositions[app.id] || { col: 0, row: 0 }}
            onOpen={() => handleOpenWindow(app)}
            onPositionChange={handleIconPositionChange}
            occupiedCells={occupiedCells}
            onContextMenu={handleIconContextMenu}
          />
        ))}

        {/* Widgets */}
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
            onClose={() => handleCloseWindow(win.id)}
            onMinimize={() => handleMinimizeWindow(win.id)}
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
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        apps={allCommandApps}
        onSelectApp={handleOpenWindow}
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

      {/* Wallpaper Settings */}
      <WallpaperSettings
        open={wallpaperSettingsOpen}
        onClose={() => setWallpaperSettingsOpen(false)}
        current={wallpaper}
        onApply={handleApplyWallpaper}
        onUploadFile={uploadWallpaperFile}
      />
    </div>
  );
}
