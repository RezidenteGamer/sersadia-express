import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, MapPin, Calendar, Users, Settings,
  CreditCard, UserCheck, Image, BarChart3
} from 'lucide-react';
import { useDesktopManager, DesktopApp } from './useDesktopManager';
import { DesktopWindow } from './DesktopWindow';
import { DesktopTaskbar } from './DesktopTaskbar';
import { DesktopIcon } from './DesktopIcon';

// Inline content components (no AppLayout wrapper)
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

export function AdminDesktop() {
  const { isAdmin, permissions } = useAuth();
  const {
    windows, openWindow, closeWindow, minimizeWindow,
    toggleMaximize, focusWindow, updatePosition, toggleMinimizeFromTaskbar,
  } = useDesktopManager();

  const availableApps = useMemo(() => {
    return ALL_APPS.filter(app => {
      if (app.adminOnly) return isAdmin;
      if (app.permission) return isAdmin || permissions.includes(app.permission);
      return true;
    });
  }, [isAdmin, permissions]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Desktop Area */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-background) / 0.8) 50%, hsl(var(--primary) / 0.15) 100%)',
        }}
      >
        {/* Desktop Icons Grid */}
        <div className="absolute inset-0 p-6 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 auto-rows-min gap-2 content-start">
          {availableApps.map(app => (
            <DesktopIcon
              key={app.id}
              icon={app.icon}
              label={app.title}
              onClick={() => openWindow(app)}
            />
          ))}
        </div>

        {/* Floating Windows */}
        {windows.map(win => (
          <DesktopWindow
            key={win.id}
            window={win}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onToggleMaximize={() => toggleMaximize(win.id)}
            onFocus={() => focusWindow(win.id)}
            onUpdatePosition={(pos) => updatePosition(win.id, pos)}
          />
        ))}
      </div>

      {/* Taskbar */}
      <DesktopTaskbar
        windows={windows}
        onToggleWindow={toggleMinimizeFromTaskbar}
      />
    </div>
  );
}
