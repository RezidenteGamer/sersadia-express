import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, MapPin, Calendar, Bell, LogOut, Home, Menu, X, User, Monitor, LogIn, Headset, IdCard, Sun, Moon } from 'lucide-react';
import { useUserMembership } from '@/hooks/useMembers';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useThemeToggle } from '@/hooks/useThemeToggle';
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

const userNavItems: NavItem[] = [
  { label: 'Início', href: '/dashboard', icon: Home },
  { label: 'Locais', href: '/locations', icon: MapPin },
  { label: 'Minhas Reservas', href: '/my-reservations', icon: Calendar },
  { label: 'Notificações', href: '/notifications', icon: Bell },
  { label: 'Suporte', href: '/support', icon: Headset },
  { label: 'Meu Perfil', href: '/profile', icon: User },
];

const adminNavItems: NavItem[] = [
  { label: 'Administração', href: '/admin', icon: Monitor, adminOnly: true },
];

// Bottom nav items (mobile) — 5 max
const bottomNavItems: NavItem[] = [
  { label: 'Início', href: '/dashboard', icon: Home },
  { label: 'Locais', href: '/locations', icon: MapPin },
  { label: 'Reservas', href: '/my-reservations', icon: Calendar },
  { label: 'Avisos', href: '/notifications', icon: Bell },
  { label: 'Perfil', href: '/profile', icon: User },
];

export function Sidebar() {
  const { user, profile, isAdmin, permissions, signOut } = useAuth();
  const { data: membership } = useUserMembership(user?.id);
  const { data: unreadCount } = useUnreadNotificationsCount();
  const { isDark, toggleTheme } = useThemeToggle();
  useRealtimeNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return isAdmin || permissions.includes(permission);
  };

  const filteredAdminItems = adminNavItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    return hasPermission(item.permission);
  });

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center justify-center">
          <BrandLogo className="h-20" forceDark />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Visitor Navigation */}
        {!user && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[1.2px] px-3 mb-2 text-sidebar-foreground/50 font-medium">
              Menu
            </p>
            <Link
              to="/locations"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 h-11 rounded-md transition-all duration-150",
                location.pathname.startsWith('/locations')
                  ? "bg-sidebar-primary text-white border-l-[3px] border-l-white"
                  : "text-sidebar-foreground hover:bg-white/[0.08]"
              )}
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium text-sm">Locais</span>
            </Link>
          </div>
        )}

        {/* User Navigation */}
        {user && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[1.2px] px-3 mb-2 text-sidebar-foreground/50 font-medium">
              Menu
            </p>
            {userNavItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const showBadge = item.href === '/notifications' && unreadCount && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 h-11 rounded-md transition-all duration-150 relative",
                    isActive
                      ? "bg-sidebar-primary text-white border-l-[3px] border-l-white"
                      : "text-sidebar-foreground hover:bg-white/[0.08] hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {showBadge && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Carteirinha Digital */}
            {membership && (
              <Link
                to="/carteirinha"
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 h-11 rounded-md transition-all duration-150",
                  location.pathname === '/carteirinha'
                    ? "bg-sidebar-primary text-white border-l-[3px] border-l-white"
                    : "text-sidebar-foreground hover:bg-white/[0.08] hover:text-white"
                )}
              >
                <IdCard className="w-5 h-5" />
                <span className="font-medium text-sm">Carteirinha Digital</span>
              </Link>
            )}
          </div>
        )}

        {/* Admin Navigation */}
        {user && isAdmin && filteredAdminItems.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[1.2px] px-3 mb-2 text-sidebar-foreground/50 font-medium">
              Administração
            </p>
            {filteredAdminItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 h-11 rounded-md transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-white border-l-[3px] border-l-white"
                      : "text-sidebar-foreground hover:bg-white/[0.08] hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 h-10 w-full rounded-md text-sidebar-foreground hover:bg-white/[0.08] hover:text-white transition-all duration-150"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        {user ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-semibold text-sm text-white font-serif">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-xs truncate text-sidebar-foreground/60">
                  {profile?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 h-10 w-full rounded-md text-sidebar-foreground hover:bg-white/[0.08] hover:text-white transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => { setIsMobileOpen(false); navigate('/auth'); }}
            className="flex items-center gap-3 px-3 h-10 w-full rounded-md text-sidebar-foreground hover:bg-white/[0.08] hover:text-white transition-all duration-150"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-sm">Entrar / Cadastrar</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-sidebar">
        <div className="flex flex-col h-full overflow-hidden">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar shadow-[0_-2px_12px_rgba(0,0,0,0.15)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16">
          {(user ? bottomNavItems : [{ label: 'Locais', href: '/locations', icon: MapPin }]).map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const showBadge = item.href === '/notifications' && unreadCount && unreadCount > 0;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-center gap-0.5 relative py-1 px-2"
              >
                <div className="relative w-[22px] h-[22px] flex-shrink-0">
                  <Icon className={cn("w-[22px] h-[22px] absolute inset-0 transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/70")} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-white text-[7px] font-bold min-w-[12px] h-[12px] rounded-full flex items-center justify-center px-0.5 pointer-events-none leading-none z-10">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-sidebar-foreground/70")}>
                  {item.label}
                </span>
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
          {/* More menu for items not in bottom nav (support, admin, etc.) */}
          {user && (
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2"
            >
              <Menu className={cn("w-[22px] h-[22px] transition-colors", isMobileOpen ? "text-primary" : "text-sidebar-foreground/70")} />
              <span className={cn("text-[10px] font-medium", isMobileOpen ? "text-primary" : "text-sidebar-foreground/70")}>Mais</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile slide-up menu */}
      {isMobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsMobileOpen(false)} />
          <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[70] bg-card rounded-t-2xl shadow-2xl p-4 space-y-1 animate-slide-up" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
            
            {/* Support */}
            <Link to="/support" onClick={() => setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors", location.pathname === '/support' ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent")}>
              <Headset className="w-5 h-5" />
              <span className="font-medium text-sm">Suporte</span>
            </Link>

            {/* Carteirinha */}
            {membership && (
              <Link to="/carteirinha" onClick={() => setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors", location.pathname === '/carteirinha' ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent")}>
                <IdCard className="w-5 h-5" />
                <span className="font-medium text-sm">Carteirinha Digital</span>
              </Link>
            )}

            {/* Admin */}
            {isAdmin && (
              <Link to="/admin" onClick={() => setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors", location.pathname === '/admin' ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent")}>
                <Monitor className="w-5 h-5" />
                <span className="font-medium text-sm">Administração</span>
              </Link>
            )}

            {/* Theme */}
            <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-foreground hover:bg-accent transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium text-sm">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            {/* Logout */}
            <button onClick={() => { setIsMobileOpen(false); signOut(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sair</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
