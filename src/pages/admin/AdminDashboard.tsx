import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];

  // Stats queries
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalReservations },
        { count: pendingReservations },
        { count: confirmedReservations },
        { count: todayReservations },
        { count: totalUsers },
        { count: activeLocations },
      ] = await Promise.all([
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('reservation_date', today),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      return {
        totalReservations: totalReservations || 0,
        pendingReservations: pendingReservations || 0,
        confirmedReservations: confirmedReservations || 0,
        todayReservations: todayReservations || 0,
        totalUsers: totalUsers || 0,
        activeLocations: activeLocations || 0,
      };
    },
  });

  // Pending reservations
  const { data: pendingList, isLoading: loadingPending } = useQuery({
    queryKey: ['admin-pending-reservations'],
    queryFn: async () => {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*, location:locations(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Get profiles
      const userIds = [...new Set(reservations.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return reservations.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id),
      }));
    },
  });

  // Today's reservations for check-in
  const { data: todayList, isLoading: loadingToday } = useQuery({
    queryKey: ['admin-today-reservations'],
    queryFn: async () => {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*, location:locations(name)')
        .eq('reservation_date', today)
        .in('status', ['confirmed', 'presence_confirmed'])
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      const userIds = [...new Set(reservations.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return reservations.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id),
      }));
    },
  });

  return (
    <AppLayout>
      <PageHeader 
        title="Dashboard Administrativo"
        description="Visão geral do sistema de reservas"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Reservas"
          value={stats?.totalReservations || 0}
          icon={Calendar}
          variant="primary"
        />
        <StatCard
          title="Pendentes"
          value={stats?.pendingReservations || 0}
          icon={AlertCircle}
          variant="warning"
        />
        <StatCard
          title="Confirmadas"
          value={stats?.confirmedReservations || 0}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Hoje"
          value={stats?.todayReservations || 0}
          icon={Clock}
          variant="primary"
        />
        <StatCard
          title="Usuários"
          value={stats?.totalUsers || 0}
          icon={Users}
        />
        <StatCard
          title="Locais Ativos"
          value={stats?.activeLocations || 0}
          icon={MapPin}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Reservas Pendentes
            </CardTitle>
            <Link to="/admin/reservations?status=pending">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : pendingList && pendingList.length > 0 ? (
              <div className="space-y-3">
                {pendingList.map((reservation: any) => (
                  <div 
                    key={reservation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{reservation.user_profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.location?.name} • {format(new Date(reservation.reservation_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Link to={`/admin/reservations?id=${reservation.id}`}>
                      <Button size="sm" variant="outline">
                        Analisar
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Tudo em dia!"
                description="Não há reservas pendentes"
              />
            )}
          </CardContent>
        </Card>

        {/* Today's Check-ins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Reservas de Hoje
            </CardTitle>
            <Link to="/admin/checkin">
              <Button variant="ghost" size="sm">
                Check-in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingToday ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : todayList && todayList.length > 0 ? (
              <div className="space-y-3">
                {todayList.map((reservation: any) => (
                  <div 
                    key={reservation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{reservation.user_profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.location?.name} • {reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}
                      </p>
                    </div>
                    <StatusBadge status={reservation.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="Sem reservas hoje"
                description="Não há reservas programadas para hoje"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
