import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllReservations, useUpdateReservationStatus, useCancelReservation, Reservation } from '@/hooks/useReservations';
import { useLocations } from '@/hooks/useLocations';
import { usePayments } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Search, Check, X, Eye, Filter, MapPin, Clock, User, AlertTriangle } from 'lucide-react';

export function AdminReservationsContent() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as any || undefined;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const [viewReservation, setViewReservation] = useState<Reservation | null>(null);
  const [actionReservation, setActionReservation] = useState<{ reservation: Reservation; action: 'confirm' | 'reject' | 'cancel' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  
  const { data: reservations, isLoading } = useAllReservations({
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
    date: dateFilter || undefined,
  });
  const { data: locations } = useLocations(true);
  const { data: payments } = usePayments();
  const updateStatus = useUpdateReservationStatus();
  const cancelReservation = useCancelReservation();

  const getPaymentForReservation = (reservationId: string) => {
    return payments?.find(p => p.reservation_id === reservationId && p.is_paid);
  };

  const handleAction = async () => {
    if (!actionReservation) return;
    
    const { reservation, action } = actionReservation;
    
    try {
      if (action === 'confirm') {
        await updateStatus.mutateAsync({ 
          id: reservation.id, 
          status: 'confirmed',
          adminNotes: adminNotes || undefined,
        });
      } else if (action === 'reject') {
        await updateStatus.mutateAsync({ 
          id: reservation.id, 
          status: 'rejected',
          adminNotes: adminNotes || undefined,
        });
      } else if (action === 'cancel') {
        const amount = refundAmount ? parseFloat(refundAmount) : undefined;
        await cancelReservation.mutateAsync({ 
          id: reservation.id, 
          refundAmount: amount,
        });
      }
      setActionReservation(null);
      setAdminNotes('');
      setRefundAmount('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const openCancelDialog = (reservation: Reservation) => {
    const payment = getPaymentForReservation(reservation.id);
    setRefundAmount(payment ? String(payment.amount) : String(reservation.total_price));
    setActionReservation({ reservation, action: 'cancel' });
  };

  const filteredReservations = reservations?.filter(r => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      r.user_profile?.full_name?.toLowerCase().includes(searchLower) ||
      r.user_profile?.email?.toLowerCase().includes(searchLower) ||
      r.code.toLowerCase().includes(searchLower) ||
      r.location?.name?.toLowerCase().includes(searchLower)
    );
  });

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'rejected', label: 'Recusadas' },
    { value: 'cancelled_by_user', label: 'Canceladas (Usuário)' },
    { value: 'cancelled_by_admin', label: 'Canceladas (Admin)' },
    { value: 'presence_confirmed', label: 'Presença Confirmada' },
  ];

  return (
    <>
      <PageHeader
        title="Gerenciar Reservas"
        description="Aprove, recuse e gerencie todas as reservas"
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filtrar por data"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredReservations && filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Main Info */}
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
                      <span className="text-sm text-muted-foreground">({reservation.user_profile?.email})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.location?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(reservation.reservation_date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}</span>
                      </div>
                      <span className="text-primary font-medium">
                        R$ {reservation.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewReservation(reservation)}
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {reservation.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-success hover:text-success"
                          onClick={() => setActionReservation({ reservation, action: 'confirm' })}
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setActionReservation({ reservation, action: 'reject' })}
                          title="Recusar"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {['confirmed', 'pending'].includes(reservation.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openCancelDialog(reservation)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="Nenhuma reserva encontrada"
          description="Não há reservas com os filtros selecionados"
        />
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewReservation} onOpenChange={() => setViewReservation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {viewReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Código</p>
                  <p className="font-mono font-medium">{viewReservation.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={viewReservation.status} />
                </div>
                <div>
                  <p className="text-muted-foreground">Usuário</p>
                  <p className="font-medium">{viewReservation.user_profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{viewReservation.user_profile?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Local</p>
                  <p className="font-medium">{viewReservation.location?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{format(new Date(viewReservation.reservation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Horário</p>
                  <p className="font-medium">{viewReservation.start_time.substring(0, 5)} - {viewReservation.end_time.substring(0, 5)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium text-primary">R$ {viewReservation.total_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{format(new Date(viewReservation.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              
              {viewReservation.user_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Observações do Usuário:</p>
                  <p className="text-sm">{viewReservation.user_notes}</p>
                </div>
              )}
              
              {viewReservation.admin_notes && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Observações do Admin:</p>
                  <p className="text-sm">{viewReservation.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionReservation} onOpenChange={() => { setActionReservation(null); setAdminNotes(''); setRefundAmount(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionReservation?.action === 'confirm' && 'Confirmar Reserva'}
              {actionReservation?.action === 'reject' && 'Recusar Reserva'}
              {actionReservation?.action === 'cancel' && 'Cancelar Reserva'}
            </DialogTitle>
            <DialogDescription>
              {actionReservation?.action === 'confirm' && 'A reserva será aprovada e o usuário será notificado.'}
              {actionReservation?.action === 'reject' && 'A reserva será recusada e o usuário será notificado.'}
              {actionReservation?.action === 'cancel' && 'A reserva será cancelada e o reembolso será processado.'}
            </DialogDescription>
          </DialogHeader>
          
          {actionReservation && actionReservation.action === 'confirm' && (
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Observações (opcional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione uma observação para o usuário..."
                rows={3}
              />
            </div>
          )}

          {actionReservation && actionReservation.action === 'reject' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  O usuário será notificado da recusa com a justificativa abaixo.
                </p>
              </div>
              <Label htmlFor="admin-notes">Justificativa (obrigatória) *</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Informe o motivo da recusa..."
                rows={3}
              />
            </div>
          )}

          {actionReservation && actionReservation.action === 'cancel' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p><strong>Reserva:</strong> {actionReservation.reservation.code}</p>
                <p><strong>Valor Total:</strong> R$ {actionReservation.reservation.total_price.toFixed(2)}</p>
                {getPaymentForReservation(actionReservation.reservation.id) && (
                  <p><strong>Pagamento:</strong> R$ {getPaymentForReservation(actionReservation.reservation.id)!.amount.toFixed(2)} (pago)</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Valor do Reembolso (R$)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0}
                  max={actionReservation.reservation.total_price}
                  step={0.01}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Informe o valor a ser reembolsado. Pode ser inferior ao total caso haja multa.
                </p>
              </div>
              {refundAmount && parseFloat(refundAmount) < actionReservation.reservation.total_price && (
                <div className="flex items-center gap-2 p-2 bg-warning/10 rounded text-sm text-warning">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Multa de R$ {(actionReservation.reservation.total_price - parseFloat(refundAmount)).toFixed(2)} será aplicada.</span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionReservation(null); setAdminNotes(''); setRefundAmount(''); }}>
              Voltar
            </Button>
            <Button
              variant={actionReservation?.action === 'confirm' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={updateStatus.isPending || cancelReservation.isPending || (actionReservation?.action === 'reject' && !adminNotes.trim())}
            >
              {updateStatus.isPending || cancelReservation.isPending ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminReservations() {
  return <AppLayout><AdminReservationsContent /></AppLayout>;
}
