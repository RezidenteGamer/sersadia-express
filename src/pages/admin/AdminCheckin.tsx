import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTodayReservations, useAllReservations, Reservation } from '@/hooks/useReservations';
import { useLocations } from '@/hooks/useLocations';
import { usePerformCheckin, useCheckinSettings, useUpdateCheckinSettings } from '@/hooks/useCheckin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserCheck, Search, Clock, MapPin, User, Calendar, Settings, Check } from 'lucide-react';

export function AdminCheckinContent() {
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const [checkinReservation, setCheckinReservation] = useState<Reservation | null>(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toleranceBefore, setToleranceBefore] = useState(15);
  const [toleranceAfter, setToleranceAfter] = useState(30);
  
  const isToday = dateFilter === new Date().toISOString().split('T')[0];
  
  const { data: todayReservations, isLoading: loadingToday } = useTodayReservations();
  const { data: allReservations, isLoading: loadingAll } = useAllReservations({
    date: dateFilter,
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  });
  const { data: locations } = useLocations(true);
  const { data: settings } = useCheckinSettings();
  const updateSettings = useUpdateCheckinSettings();
  const performCheckin = usePerformCheckin();

  const reservations = isToday ? todayReservations : allReservations;
  const isLoading = isToday ? loadingToday : loadingAll;

  const handleCheckin = async () => {
    if (!checkinReservation || !checkinCode) return;
    
    try {
      await performCheckin.mutateAsync({
        reservationId: checkinReservation.id,
        code: checkinCode,
      });
      setCheckinReservation(null);
      setCheckinCode('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        tolerance_before_minutes: toleranceBefore,
        tolerance_after_minutes: toleranceAfter,
      });
      setShowSettings(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const openSettings = () => {
    setToleranceBefore(settings?.tolerance_before_minutes || 15);
    setToleranceAfter(settings?.tolerance_after_minutes || 30);
    setShowSettings(true);
  };

  const filteredReservations = reservations?.filter(r => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      r.user_profile?.full_name?.toLowerCase().includes(searchLower) ||
      r.code.toLowerCase().includes(searchLower) ||
      r.location?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Filter only confirmed reservations for check-in
  const checkinableReservations = filteredReservations?.filter(r => 
    r.status === 'confirmed' || r.status === 'presence_confirmed'
  );

  return (
    <>
      <PageHeader
        title="Controle de Presença"
        description="Registre a presença dos usuários nas reservas"
        action={
          <Button variant="outline" onClick={openSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        }
      />

      {/* Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Local" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os locais</SelectItem>
            {locations?.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="presence_confirmed">Presença Confirmada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total do Dia</p>
              <p className="text-2xl font-bold">{reservations?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aguardando Check-in</p>
              <p className="text-2xl font-bold">
                {reservations?.filter(r => r.status === 'confirmed').length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Presenças Confirmadas</p>
              <p className="text-2xl font-bold">
                {reservations?.filter(r => r.status === 'presence_confirmed').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reservations List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : checkinableReservations && checkinableReservations.length > 0 ? (
        <div className="space-y-4">
          {checkinableReservations.map((reservation) => (
            <Card key={reservation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {reservation.code}
                      </span>
                      <StatusBadge status={reservation.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{reservation.user_profile?.full_name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.location?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {reservation.status === 'confirmed' && (
                    <Button
                      onClick={() => setCheckinReservation(reservation)}
                      className="bg-success hover:bg-success/90"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Marcar Presença
                    </Button>
                  )}
                  
                  {reservation.status === 'presence_confirmed' && (
                    <div className="flex items-center gap-2 text-success">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Presença Confirmada</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="Nenhuma reserva encontrada"
          description="Não há reservas para check-in nesta data"
        />
      )}

      {/* Check-in Dialog */}
      <Dialog open={!!checkinReservation} onOpenChange={() => { setCheckinReservation(null); setCheckinCode(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Confirmar Presença
            </DialogTitle>
            <DialogDescription>
              Digite o código da reserva informado pelo usuário para confirmar a presença.
            </DialogDescription>
          </DialogHeader>
          
          {checkinReservation && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Usuário:</strong> {checkinReservation.user_profile?.full_name}</p>
                <p><strong>Local:</strong> {checkinReservation.location?.name}</p>
                <p><strong>Horário:</strong> {checkinReservation.start_time.substring(0, 5)} - {checkinReservation.end_time.substring(0, 5)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Código da Reserva</Label>
                <Input
                  id="code"
                  value={checkinCode}
                  onChange={(e) => setCheckinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  className="font-mono text-lg text-center uppercase"
                  maxLength={10}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCheckinReservation(null); setCheckinCode(''); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCheckin}
              disabled={!checkinCode || performCheckin.isPending}
              className="bg-success hover:bg-success/90"
            >
              {performCheckin.isPending ? 'Confirmando...' : 'Confirmar Presença'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Check-in</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tolerância Antes (minutos)</Label>
              <Input
                type="number"
                min={0}
                value={toleranceBefore}
                onChange={(e) => setToleranceBefore(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Quantos minutos antes do horário o check-in pode ser feito
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Tolerância Depois (minutos)</Label>
              <Input
                type="number"
                min={0}
                value={toleranceAfter}
                onChange={(e) => setToleranceAfter(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Quantos minutos depois do horário o check-in ainda pode ser feito
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminCheckin() {
  return <AppLayout><AdminCheckinContent /></AppLayout>;
}
