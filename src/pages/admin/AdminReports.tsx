import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, TrendingUp, Users, MapPin, Calendar, UserCheck, UserX } from 'lucide-react';

const COLORS = ['hsl(173, 58%, 39%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(210, 100%, 50%)'];

export default function AdminReports() {
  const [period, setPeriod] = useState('30');

  // Reservations by status
  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['report-status', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reservations')
        .select('status')
        .gte('created_at', startDate);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
      });
      
      const statusLabels: Record<string, string> = {
        pending: 'Pendentes',
        confirmed: 'Confirmadas',
        rejected: 'Recusadas',
        cancelled_by_user: 'Canceladas (Usuário)',
        cancelled_by_admin: 'Canceladas (Admin)',
        presence_confirmed: 'Presença Confirmada',
        expired: 'Expiradas',
      };
      
      return Object.entries(counts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
      }));
    },
  });

  // Reservations by location
  const { data: locationData, isLoading: loadingLocation } = useQuery({
    queryKey: ['report-location', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reservations')
        .select('location_id, locations(name)')
        .gte('created_at', startDate);
      
      if (error) throw error;
      
      const counts: Record<string, { name: string; count: number }> = {};
      data.forEach((r: any) => {
        const locId = r.location_id;
        const locName = r.locations?.name || 'Desconhecido';
        if (!counts[locId]) {
          counts[locId] = { name: locName, count: 0 };
        }
        counts[locId].count++;
      });
      
      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(l => ({ name: l.name, reservas: l.count }));
    },
  });

  // Reservations over time
  const { data: timelineData, isLoading: loadingTimeline } = useQuery({
    queryKey: ['report-timeline', period],
    queryFn: async () => {
      const days = parseInt(period);
      const startDate = subDays(new Date(), days);
      const endDate = new Date();
      
      const { data, error } = await supabase
        .from('reservations')
        .select('created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Group by day
      const counts: Record<string, number> = {};
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      dateRange.forEach(date => {
        counts[format(date, 'yyyy-MM-dd')] = 0;
      });
      
      data.forEach(r => {
        const day = r.created_at.split('T')[0];
        if (counts[day] !== undefined) {
          counts[day]++;
        }
      });
      
      return Object.entries(counts).map(([date, count]) => ({
        date: format(new Date(date), 'dd/MM'),
        reservas: count,
      }));
    },
  });

  // Top users
  const { data: topUsersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['report-top-users', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reservations')
        .select('user_id')
        .gte('created_at', startDate)
        .eq('status', 'presence_confirmed');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(r => {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      });
      
      const topUserIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);
      
      if (topUserIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', topUserIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      return topUserIds.map(id => ({
        name: profileMap.get(id) || 'Usuário',
        presencas: counts[id],
      }));
    },
  });

  // No-show rate
  const { data: noShowData, isLoading: loadingNoShow } = useQuery({
    queryKey: ['report-noshow', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      
      // Get confirmed reservations from past dates
      const { data, error } = await supabase
        .from('reservations')
        .select('status')
        .gte('created_at', startDate)
        .lt('reservation_date', today)
        .in('status', ['confirmed', 'presence_confirmed']);
      
      if (error) throw error;
      
      const confirmed = data.filter(r => r.status === 'confirmed').length;
      const present = data.filter(r => r.status === 'presence_confirmed').length;
      
      const total = confirmed + present;
      const noShowRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0';
      const presenceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
      
      return {
        noShowRate: parseFloat(noShowRate),
        presenceRate: parseFloat(presenceRate),
        noShows: confirmed,
        present: present,
        total,
      };
    },
  });

  // Popular time slots
  const { data: timeSlotsData, isLoading: loadingTimeSlots } = useQuery({
    queryKey: ['report-timeslots', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reservations')
        .select('start_time')
        .gte('created_at', startDate);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(r => {
        const hour = r.start_time.substring(0, 2) + ':00';
        counts[hour] = (counts[hour] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([hour, count]) => ({ horario: hour, reservas: count }))
        .sort((a, b) => a.horario.localeCompare(b.horario));
    },
  });

  const isLoading = loadingStatus || loadingLocation || loadingTimeline || loadingUsers || loadingNoShow || loadingTimeSlots;

  return (
    <AppLayout>
      <PageHeader 
        title="Relatórios"
        description="Análise de dados e estatísticas do sistema"
        action={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                  <p className="text-2xl font-bold">{noShowData?.presenceRate || 0}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <UserX className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de No-show</p>
                  <p className="text-2xl font-bold">{noShowData?.noShowRate || 0}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presenças</p>
                  <p className="text-2xl font-bold">{noShowData?.present || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Avaliadas</p>
                  <p className="text-2xl font-bold">{noShowData?.total || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Reservations over time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Reservas por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="reservas" 
                        stroke="hsl(173, 58%, 39%)" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Reservations by status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Reservas por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Reservations by location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Reservas por Local
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="name" fontSize={12} width={120} />
                      <Tooltip />
                      <Bar dataKey="reservas" fill="hsl(173, 58%, 39%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Popular time slots */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horários Mais Populares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSlotsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="horario" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="reservas" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ranking de Presenças
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topUsersData && topUsersData.length > 0 ? (
                <div className="space-y-3">
                  {topUsersData.map((user, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <span className="text-primary font-bold">{user.presencas} presenças</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado de presença disponível
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
