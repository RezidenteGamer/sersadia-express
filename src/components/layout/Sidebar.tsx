import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, MapPin, Calendar, Users, CreditCard, UserCheck, BarChart3, Bell, Settings, LogOut, Home, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/BrandLogo';
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  adminOnly?: boolean;
}
const userNavItems: NavItem[] = [{
  label: 'Início',
  href: '/dashboard',
  icon: Home
}, {
  label: 'Locais',
  href: '/locations',
  icon: MapPin
}, {
  label: 'Minhas Reservas',
  href: '/my-reservations',
  icon: Calendar
}, {
  label: 'Notificações',
  href: '/notifications',
  icon: Bell
}, {
  label: 'Meu Perfil',
  href: '/profile',
  icon: User
}];
const adminNavItems: NavItem[] = [{
  label: 'Dashboard',
  href: '/admin',
  icon: LayoutDashboard,
  adminOnly: true
}, {
  label: 'Locais',
  href: '/admin/locations',
  icon: MapPin,
  permission: 'manage_locations'
}, {
  label: 'Reservas',
  href: '/admin/reservations',
  icon: Calendar,
  permission: 'manage_reservations'
}, {
  label: 'Sócios',
  href: '/admin/members',
  icon: Users,
  permission: 'manage_users'
}, {
  label: 'Usuários',
  href: '/admin/users',
  icon: Settings,
  permission: 'manage_users'
}, {
  label: 'Pagamentos',
  href: '/admin/payments',
  icon: CreditCard,
  permission: 'manage_payments'
}, {
  label: 'Check-in',
  href: '/admin/checkin',
  icon: UserCheck,
  permission: 'manage_checkin'
}, {
  label: 'Relatórios',
  href: '/admin/reports',
  icon: BarChart3,
  permission: 'view_reports'
}];
export function Sidebar() {
  const {
    profile,
    isAdmin,
    permissions,
    signOut
  } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return isAdmin || permissions.includes(permission);
  };
  const filteredAdminItems = adminNavItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    return hasPermission(item.permission);
  });
  const NavContent = () => <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border bg-background">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo className="h-16" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* User Navigation */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider px-3 mb-2 text-primary-foreground">
            Menu
          </p>
          {userNavItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return <Link key={item.href} to={item.href} onClick={() => setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-primary-foreground", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
                <Icon className="w-5 h-5 text-primary-foreground" />
                <span className="font-medium text-primary-foreground">{item.label}</span>
              </Link>;
        })}
        </div>

        {/* Admin Navigation */}
        {isAdmin && filteredAdminItems.length > 0 && <div>
            <p className="text-xs uppercase tracking-wider px-3 mb-2 text-primary-foreground">
              Administração
            </p>
            {filteredAdminItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return <Link key={item.href} to={item.href} onClick={() => setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-primary-foreground", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
                  <Icon className="w-5 h-5 text-white" />
                  <span className="font-medium text-primary-foreground">{item.label}</span>
                </Link>;
        })}
          </div>}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="font-medium text-sm text-primary-foreground">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-primary-foreground">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs truncate text-primary-foreground">
              {profile?.email}
            </p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={signOut}>
          <LogOut className="w-5 h-5 mr-3 text-primary-foreground" />
          Sair
        </Button>
      </div>
    </div>;
  return <>
      {/* Mobile Overlay */}
      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />}

      {/* Sidebar with attached toggle button */}
      <aside className={cn("fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out", isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        {/* Mobile Toggle Button - Attached to sidebar */}
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className={cn("lg:hidden absolute top-4 p-2 rounded-r-lg bg-sidebar text-sidebar-foreground shadow-lg transition-all duration-200 ease-in-out", isMobileOpen ? "right-4 rounded-lg" : "-right-12 rounded-r-lg")}>
          {isMobileOpen ? <X className="w-6 h-6 text-white bg-black" /> : <Menu className="w-6 h-6" />}
        </button>
        
        <NavContent />
      </aside>
    </>;
}