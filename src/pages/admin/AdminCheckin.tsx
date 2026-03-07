import { useState, useMemo } from 'react';
import { hapticSuccess } from '@/lib/native';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAllReservations, Reservation } from '@/hooks/useReservations';
import { useLocations } from '@/hooks/useLocations';
import { usePerformCheckin, useCheckinSettings, useUpdateCheckinSettings } from '@/hooks/useCheckin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  UserCheck, Search, Clock, MapPin, User, CalendarIcon, Settings, Check,
  ChevronLeft, ChevronRight, XCircle, AlertTriangle, BarChart3, X,
} from 'lucide-react';

const ITEMS_PER_PAGE = 14;

const FINISHED_STATUSES = ['presence_confirmed', 'cancelled_by_user', 'cancelled_by_admin', 'expired', 'rejected'] as const;

export function AdminCheckinContent() {
  const [activeTab, setActiveTab] = useState('waiting');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [finishedStatusFilter, setFinishedStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Check-in dialog
  const [checkinReservation, setCheckinReservation] = useState<Reservation | null>(null);
  const [checkinCode, setCheckinCode] = useState('');

  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [toleranceBefore, setToleranceBefore] = useState(15);
  const [toleranceAfter, setToleranceAfter] = useState(30);

  const { data: locations } = useLocations(true);
  const { data: settings } = useCheckinSettings();
  const updateSettings = useUpdateCheckinSettings();
  const performCheckin = usePerformCheckin();

  // Fetch waiting reservations
  const waitingFilters = useMemo(() => ({
    statuses: ['confirmed'] as any[],
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  }), [locationFilter, startDate, endDate]);

  // Fetch finished reservations
  const finishedStatuses = useMemo(() => {
    if (finishedStatusFilter !== 'all') return [finishedStatusFilter] as any[];
    return [...FINISHED_STATUSES] as any[];
  }, [finishedStatusFilter]);

  const finishedFilters = useMemo(() => ({
    statuses: finishedStatuses,
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  }), [finishedStatuses, locationFilter, startDate, endDate]);

  const { data: waitingData, isLoading: loadingWaiting } = useAllReservations(waitingFilters);
  const { data: finishedData, isLoading: loadingFinished } = useAllReservations(finishedFilters);

  const isWaiting = activeTab === 'waiting';
  const rawData = isWaiting ? waitingData : finishedData;
  const isLoading = isWaiting ? loadingWaiting : loadingFinished;

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!rawData) return [];
    if (!search) return rawData;
    const s = search.toLowerCase();
    return rawData.filter(r =>
      r.user_profile?.full_name?.toLowerCase().includes(s) ||
      r.code.toLowerCase().includes(s) ||
      r.location?.name?.toLowerCase().includes(s)
    );
  }, [rawData, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page on filter change
  const resetPage = () => setPage(1);

  // Stats for waiting tab
  const waitingStats = useMemo(() => {
    if (!waitingData) return { total: 0, nextHour: 0, late: 0 };
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const today = format(now, 'yyyy-MM-dd');

    let nextHour = 0;
    let late = 0;
    waitingData.forEach(r => {
      if (r.reservation_date === today) {
        const [h, m] = r.start_time.split(':').map(Number);
        const startDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        if (startDt <= now) late++;
        else if (startDt <= oneHourFromNow) nextHour++;
      }
    });
    return { total: waitingData.length, nextHour, late };
  }, [waitingData]);

  // Stats for finished tab
  const finishedStats = useMemo(() => {
    if (!finishedData) return { total: 0, presences: 0, cancellations: 0, rate: 0 };
    const presences = finishedData.filter(r => r.status === 'presence_confirmed').length;
    const cancellations = finishedData.filter(r =>
      r.status === 'cancelled_by_user' || r.status === 'cancelled_by_admin'
    ).length;
    const rate = finishedData.length > 0 ? Math.round((presences / finishedData.length) * 100) : 0;
    return { total: finishedData.length, presences, cancellations, rate };
  }, [finishedData]);

  const handleCheckin = async () => {
    if (!checkinReservation || !checkinCode) return;
    try {
      await performCheckin.mutateAsync({
        reservationId: checkinReservation.id,
        code: checkinCode,
      });
      await hapticSuccess();
      setCheckinReservation(null);
      setCheckinCode('');
    } catch {
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
    } catch {
      // Error handled by mutation
    }
  };

  const openSettings = () => {
    setToleranceBefore(settings?.tolerance_before_minutes || 15);
    setToleranceAfter(settings?.tolerance_after_minutes || 30);
    setShowSettings(true);
  };

  const clearFilters = () => {
    setSearch('');
    setLocationFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setFinishedStatusFilter('all');
    resetPage();
  };

  const hasActiveFilters = search || locationFilter !== 'all' || startDate || endDate || finishedStatusFilter !== 'all';

  return (
    <>
      <PageHeader
        title="Controle de Presença"
        description="Registre e acompanhe a presença dos usuários"
        action={
          <Button variant="outline" onClick={openSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetPage(); }}>
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="waiting" className="flex-1 sm:flex-none gap-2">
            <Clock className="w-4 h-4" />
            Aguardando
            {waitingData && waitingData.length > 0 && (
              <span className="ml-1 bg-warning/20 text-warning text-xs font-bold px-2 py-0.5 rounded-full">
                {waitingData.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="finished" className="flex-1 sm:flex-none gap-2">
            <Check className="w-4 h-4" />
            Finalizadas
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código ou local..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              />
            </div>
            <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); resetPage(); }}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os locais</SelectItem>
                {locations?.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Date range */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2 text-sm", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data início'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => { setStartDate(d); resetPage(); }}
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-sm">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2 text-sm", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data fim'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => { setEndDate(d); resetPage(); }}
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Finished status filter (only on finished tab) */}
            {activeTab === 'finished' && (
              <Select value={finishedStatusFilter} onValueChange={(v) => { setFinishedStatusFilter(v); resetPage(); }}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="presence_confirmed">Presença confirmada</SelectItem>
                  <SelectItem value="cancelled_by_user">Cancelada (usuário)</SelectItem>
                  <SelectItem value="cancelled_by_admin">Cancelada (admin)</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="rejected">Recusada</SelectItem>
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="w-4 h-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Stats - Waiting */}
        <TabsContent value="waiting" className="mt-0">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                  <p className="text-2xl font-bold">{waitingStats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próxima 1h</p>
                  <p className="text-2xl font-bold">{waitingStats.nextHour}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Atrasados</p>
                  <p className="text-2xl font-bold">{waitingStats.late}</p>
                </div>
              </div>
            </Card>
          </div>

          <ReservationList
            reservations={paginated}
            isLoading={isLoading}
            isWaiting={true}
            onCheckin={setCheckinReservation}
          />
        </TabsContent>

        {/* Stats - Finished */}
        <TabsContent value="finished" className="mt-0">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Presenças</p>
                  <p className="text-2xl font-bold">{finishedStats.presences}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                  <p className="text-2xl font-bold">{finishedStats.rate}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cancelamentos</p>
                  <p className="text-2xl font-bold">{finishedStats.cancellations}</p>
                </div>
              </div>
            </Card>
          </div>

          <ReservationList
            reservations={paginated}
            isLoading={isLoading}
            isWaiting={false}
            onCheckin={setCheckinReservation}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} ({filtered.length} resultados)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
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
            <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Extracted list component
function ReservationList({
  reservations,
  isLoading,
  isWaiting,
  onCheckin,
}: {
  reservations: Reservation[];
  isLoading: boolean;
  isWaiting: boolean;
  onCheckin: (r: Reservation) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <EmptyState
        icon={isWaiting ? Clock : Check}
        title={isWaiting ? 'Nenhuma reserva aguardando' : 'Nenhuma reserva finalizada'}
        description={isWaiting ? 'Não há reservas aguardando check-in com esses filtros' : 'Não há reservas finalizadas com esses filtros'}
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
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
                  <span className="font-medium">{reservation.user_profile?.full_name || 'Usuário'}</span>
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
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {format(new Date(reservation.reservation_date + 'T12:00:00'), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {isWaiting && reservation.status === 'confirmed' && (
                <Button
                  onClick={() => onCheckin(reservation)}
                  className="bg-success hover:bg-success/90 shrink-0"
                  size="lg"
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Marcar Presença
                </Button>
              )}

              {!isWaiting && reservation.status === 'presence_confirmed' && (
                <div className="flex items-center gap-2 text-success shrink-0">
                  <Check className="w-5 h-5" />
                  <span className="font-medium text-sm">Presença OK</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminCheckin() {
  return <AppLayout><AdminCheckinContent /></AppLayout>;
}
