import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, MapPin, Clock, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';

export default function Dashboard() {
  const { profile, user } = useAuth();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['my-reservations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          location:locations(name, images)
        `)
        .eq('user_id', user!.id)
        .order('reservation_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const { data: total } = await supabase
        .from('reservations')
        .select('id', { count: 'exact' })
        .eq('user_id', user!.id);

      const { data: confirmed } = await supabase
        .from('reservations')
        .select('id', { count: 'exact' })
        .eq('user_id', user!.id)
        .eq('status', 'confirmed');

      const { data: pending } = await supabase
        .from('reservations')
        .select('id', { count: 'exact' })
        .eq('user_id', user!.id)
        .eq('status', 'pending');

      return {
        total: total?.length || 0,
        confirmed: confirmed?.length || 0,
        pending: pending?.length || 0,
      };
    },
    enabled: !!user?.id,
  });

  const upcomingReservations = reservations?.filter(r => 
    new Date(r.reservation_date) >= new Date() && 
    ['confirmed', 'pending'].includes(r.status)
  );

  return (
    <AppLayout>
      <PageHeader 
        title={`Olá, ${profile?.full_name?.split(' ')[0] || 'Usuário'}!`}
        description="Gerencie suas reservas e acompanhe seus agendamentos"
        action={
          <Link to="/locations">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Reserva
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total de Reservas"
          value={stats?.total || 0}
          icon={Calendar}
          variant="primary"
        />
        <StatCard
          title="Confirmadas"
          value={stats?.confirmed || 0}
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Pendentes"
          value={stats?.pending || 0}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Próximas Reservas</CardTitle>
          <Link to="/my-reservations">
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : upcomingReservations && upcomingReservations.length > 0 ? (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <div 
                  key={reservation.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {reservation.location?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(reservation.reservation_date), "dd 'de' MMMM", { locale: ptBR })}
                      {' • '}
                      {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Nenhuma reserva"
              description="Você ainda não tem reservas. Que tal fazer a primeira?"
              action={{
                label: 'Ver Locais',
                onClick: () => window.location.href = '/locations',
              }}
            />
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}