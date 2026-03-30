import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUserReservations, useCancelReservation, calculateCancellationFee } from '@/hooks/useReservations';
import { usePayments } from '@/hooks/usePayments';
import { useLocations } from '@/hooks/useLocations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, X, Eye, CreditCard, AlertTriangle, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PixPaymentDialog } from '@/components/PixPaymentDialog';

export default function MyReservations() {
  const {
    data: reservations,
    isLoading
  } = useUserReservations();
  const { data: payments } = usePayments();
  const { data: locations } = useLocations();
  const cancelReservation = useCancelReservation();
  const navigate = useNavigate();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelFeeInfo, setCancelFeeInfo] = useState<{ fee: number; refundAmount: number; isWithinDeadline: boolean } | null>(null);
  const [viewReservation, setViewReservation] = useState<typeof reservations extends (infer T)[] ? T : never | null>(null);
  const [pixPaymentReservation, setPixPaymentReservation] = useState<NonNullable<typeof reservations>[0] | null>(null);

  // Check if a reservation has been paid
  const isReservationPaid = (reservationId: string) => {
    return payments?.some(p => p.reservation_id === reservationId && p.is_paid);
  };

  const handlePayment = (reservation: NonNullable<typeof reservations>[0]) => {
    setPixPaymentReservation(reservation);
  };

  if (isLoading) {
    return <AppLayout>
        <LoadingSpinner />
      </AppLayout>;
  }
  const pendingReservations = reservations?.filter(r => r.status === 'pending') || [];
  const confirmedReservations = reservations?.filter(r => ['confirmed', 'presence_confirmed'].includes(r.status)) || [];
  const pastReservations = reservations?.filter(r => ['rejected', 'cancelled_by_user', 'cancelled_by_admin', 'expired'].includes(r.status)) || [];
  const handleOpenCancel = (reservation: NonNullable<typeof reservations>[0]) => {
    const location = locations?.find(l => l.id === reservation.location_id);
    const feeType = (location as any)?.cancellation_fee_type || 'percentage';
    const feeValue = (location as any)?.cancellation_fee_value || 0;
    const deadlineHours = (location as any)?.cancellation_deadline_hours ?? 24;
    
    const info = calculateCancellationFee(
      reservation.total_price,
      feeType,
      feeValue,
      deadlineHours,
      reservation.reservation_date,
      reservation.start_time,
    );
    setCancelFeeInfo(info);
    setCancelId(reservation.id);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelReservation.mutateAsync({ id: cancelId, refundAmount: cancelFeeInfo?.refundAmount });
    setCancelId(null);
    setCancelFeeInfo(null);
  };
  const ReservationCard = ({
    reservation
  }: {
    reservation: NonNullable<typeof reservations>[0];
  }) => {
    const isPaid = isReservationPaid(reservation.id);
    const showPayButton = ['pending', 'confirmed', 'presence_confirmed'].includes(reservation.status) && !isPaid;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {reservation.location?.images?.[0] ? <img src={reservation.location.images[0]} alt={reservation.location.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{reservation.location?.name || 'Local'}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(reservation.reservation_date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={reservation.status} />
                  {isPaid && <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">Pago</span>}
                  {!isPaid && <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full">Pendente Pagamento</span>}
                  <span className="text-sm font-medium text-primary">
                    R$ {reservation.total_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewReservation(reservation)}>
                <Eye className="w-4 h-4" />
              </Button>
              {showPayButton && (
                <Button 
                  size="sm" 
                  onClick={() => handlePayment(reservation)}
                  disabled={false}
                >
                  <CreditCard className="w-4 h-4" />
                </Button>
              )}
              {reservation.status === 'pending' && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleOpenCancel(reservation)}>
                  <X className="w-4 h-4" />
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  return <AppLayout>
      <PageHeader title="Minhas Reservas" description="Acompanhe todas as suas reservas" />
      
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingReservations.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmadas ({confirmedReservations.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico ({pastReservations.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {pendingReservations.length === 0 ? <EmptyState icon={Calendar} title="Nenhuma reserva pendente" description="Suas reservas aguardando aprovação aparecerão aqui" action={{
          label: 'Fazer Reserva',
          onClick: () => navigate('/locations')
        }} /> : pendingReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
        
        <TabsContent value="confirmed" className="space-y-4">
          {confirmedReservations.length === 0 ? <EmptyState icon={Calendar} title="Nenhuma reserva confirmada" description="Suas reservas confirmadas aparecerão aqui" /> : confirmedReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {pastReservations.length === 0 ? <EmptyState icon={Calendar} title="Nenhum histórico" description="Seu histórico de reservas aparecerá aqui" /> : pastReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
      </Tabs>
      
      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => { setCancelId(null); setCancelFeeInfo(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {cancelFeeInfo && cancelFeeInfo.isWithinDeadline && cancelFeeInfo.fee > 0 && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Multa por cancelamento</p>
                <p className="text-muted-foreground mt-1">
                  Como o cancelamento está dentro do prazo limite, uma multa de <strong>R$ {cancelFeeInfo.fee.toFixed(2)}</strong> será aplicada.
                  {cancelFeeInfo.refundAmount > 0 && (
                    <> O reembolso será de <strong>R$ {cancelFeeInfo.refundAmount.toFixed(2)}</strong>.</>
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelId(null); setCancelFeeInfo(null); }}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelReservation.isPending}>
              {cancelReservation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Dialog */}
      <Dialog open={!!viewReservation} onOpenChange={() => setViewReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {viewReservation && <div className="space-y-4">
              <div className="p-4 rounded-lg space-y-2 bg-primary-foreground">
                <p><strong>Código:</strong> {viewReservation.code}</p>
                <p><strong>Local:</strong> {viewReservation.location?.name}</p>
                <p><strong>Data:</strong> {format(new Date(viewReservation.reservation_date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR
              })}</p>
                <p><strong>Horário:</strong> {viewReservation.start_time.substring(0, 5)} - {viewReservation.end_time.substring(0, 5)}</p>
                <p><strong>Valor:</strong> R$ {viewReservation.total_price.toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <StatusBadge status={viewReservation.status} />
                </div>
              </div>
              
              {viewReservation.user_notes && <div>
                  <p className="font-medium mb-1">Suas Observações:</p>
                  <p className="text-sm text-muted-foreground">{viewReservation.user_notes}</p>
                </div>}
              
              {viewReservation.admin_notes && <div>
                  <p className="font-medium mb-1">Observações da Administração:</p>
                  <p className="text-sm text-muted-foreground">{viewReservation.admin_notes}</p>
                </div>}
              
              {viewReservation.status === 'confirmed' && <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm">
                    <strong>Importante:</strong> Apresente o código{' '}
                    <button
                      onClick={() => copyToClipboard(viewReservation.code, 'Código')}
                      className="font-mono font-bold inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {viewReservation.code}
                      <Copy className="w-3 h-3" />
                    </button>
                    {' '}no momento do check-in.
                  </p>
                </div>}
            </div>}
        </DialogContent>
      </Dialog>
    </AppLayout>;
}