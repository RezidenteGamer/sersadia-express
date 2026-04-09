import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUserReservations, useCancelReservation } from '@/hooks/useReservations';
import { usePayments } from '@/hooks/usePayments';
import { useLocations } from '@/hooks/useLocations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, X, Eye, CreditCard, AlertTriangle, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyToClipboard } from '@/lib/native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PixPaymentDialog } from '@/components/PixPaymentDialog';
import { useUploadReceipt } from '@/hooks/usePayments';

export default function MyReservations() {
  const {
    data: reservations,
    isLoading
  } = useUserReservations();
  const { data: payments } = usePayments();
  const { data: locations } = useLocations();
  const cancelReservation = useCancelReservation();
  const navigate = useNavigate();
  const uploadReceipt = useUploadReceipt();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReservationData, setCancelReservationData] = useState<NonNullable<typeof reservations>[0] | null>(null);
  const [cancelPixKey, setCancelPixKey] = useState('');
  const [cancelPixName, setCancelPixName] = useState('');
  const [isFullRefund, setIsFullRefund] = useState(false);
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
    // Check if cancellation is 48h+ before reservation
    const [year, month, day] = reservation.reservation_date.split('-').map(Number);
    const [hours, minutes] = reservation.start_time.split(':').map(Number);
    const reservationStart = new Date(year, month - 1, day, hours, minutes);
    const diffMs = reservationStart.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    setIsFullRefund(diffHours >= 48);
    setCancelReservationData(reservation);
    setCancelPixKey('');
    setCancelPixName('');
    setCancelId(reservation.id);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    if (!cancelPixKey.trim() || !cancelPixName.trim()) {
      toast.error('Informe a chave PIX e o nome do recebedor para prosseguir.');
      return;
    }
    await cancelReservation.mutateAsync({ 
      id: cancelId, 
      refundPixKey: cancelPixKey.trim(),
      refundPixName: cancelPixName.trim(),
    });
    setCancelId(null);
    setCancelReservationData(null);
    setCancelPixKey('');
    setCancelPixName('');
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
                
                {/* Código da reserva - super destaque para reservas confirmadas */}
                {['confirmed', 'presence_confirmed'].includes(reservation.status) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(reservation.code, 'Código da reserva');
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 bg-primary/15 border-2 border-primary/30 rounded-xl hover:bg-primary/25 transition-colors group w-fit animate-pulse-once"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Código para Check-in</span>
                      <span className="font-mono font-extrabold text-primary text-xl tracking-[0.25em]">{reservation.code}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[9px] text-muted-foreground">Copiar</span>
                    </div>
                  </button>
                )}
                
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
              {['pending', 'confirmed'].includes(reservation.status) && (
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleOpenCancel(reservation)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  return <AppLayout>
      <PageHeader title="Minhas Reservas" description="Acompanhe todas as suas reservas" />
      
      <Tabs defaultValue="confirmed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="confirmed">
            Confirmadas ({confirmedReservations.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingReservations.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico ({pastReservations.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="confirmed" className="space-y-4">
          {confirmedReservations.length === 0 ? <EmptyState icon={Calendar} title="Nenhuma reserva confirmada" description="Suas reservas confirmadas aparecerão aqui" action={{
          label: 'Fazer Reserva',
          onClick: () => navigate('/locations')
        }} /> : confirmedReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          {pendingReservations.length === 0 ? <EmptyState icon={Calendar} title="Nenhuma reserva pendente" description="Suas reservas aguardando aprovação aparecerão aqui" /> : pendingReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {pastReservations.length === 0 ? <EmptyState icon={Calendar} title="Nenhum histórico" description="Seu histórico de reservas aparecerá aqui" /> : pastReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
      </Tabs>
      
      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => { setCancelId(null); setCancelReservationData(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta reserva? Informe seus dados PIX para receber o reembolso.
            </DialogDescription>
          </DialogHeader>
          
          {isFullRefund ? (
            <div className="flex items-start gap-2 p-3 bg-success/10 rounded-lg text-sm">
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success">Reembolso total</p>
                <p className="text-muted-foreground mt-1">
                  O cancelamento está sendo feito com mais de 48 horas de antecedência. O reembolso será integral (R$ {cancelReservationData?.total_price.toFixed(2)}).
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Cancelamento com menos de 48h</p>
                <p className="text-muted-foreground mt-1">
                  O cancelamento está sendo feito com menos de 48 horas de antecedência. O valor do reembolso será definido pela administração.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-pix-key">Chave PIX para reembolso *</Label>
              <Input
                id="cancel-pix-key"
                value={cancelPixKey}
                onChange={(e) => setCancelPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-pix-name">Nome do recebedor *</Label>
              <Input
                id="cancel-pix-name"
                value={cancelPixName}
                onChange={(e) => setCancelPixName(e.target.value)}
                placeholder="Nome completo do titular da conta"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelId(null); setCancelReservationData(null); }}>
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={cancelReservation.isPending || !cancelPixKey.trim() || !cancelPixName.trim()}
            >
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

      {/* PIX Payment Dialog */}
      {pixPaymentReservation && (
        <PixPaymentDialog
          open={!!pixPaymentReservation}
          onOpenChange={(open) => !open && setPixPaymentReservation(null)}
          amount={pixPaymentReservation.total_price}
          locationName={locations?.find(l => l.id === pixPaymentReservation.location_id)?.name || 'Local'}
          onPaymentComplete={async (receiptUrl) => {
            await uploadReceipt.mutateAsync({ reservationId: pixPaymentReservation.id, receiptUrl });
            toast.success('Comprovante enviado! O pagamento será confirmado pelo administrador.');
            setPixPaymentReservation(null);
          }}
        />
      )}
    </AppLayout>;
}