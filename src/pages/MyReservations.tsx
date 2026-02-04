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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, X, Eye, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export default function MyReservations() {
  const {
    data: reservations,
    isLoading
  } = useUserReservations();
  const { data: payments } = usePayments();
  const cancelReservation = useCancelReservation();
  const navigate = useNavigate();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [viewReservation, setViewReservation] = useState<typeof reservations extends (infer T)[] ? T : never | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check if a reservation has been paid
  const isReservationPaid = (reservationId: string) => {
    return payments?.some(p => p.reservation_id === reservationId && p.is_paid);
  };

  const handlePayment = async (reservation: NonNullable<typeof reservations>[0]) => {
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-checkout', {
        body: {
          reservationId: reservation.id,
          amount: reservation.total_price,
        },
      });

      if (error) throw error;

      if (data?.sandboxInitPoint || data?.initPoint) {
        window.location.href = data.sandboxInitPoint || data.initPoint;
      } else {
        throw new Error('URL de pagamento não retornada');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Erro ao iniciar pagamento: ' + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return <AppLayout>
        <LoadingSpinner />
      </AppLayout>;
  }
  const pendingReservations = reservations?.filter(r => r.status === 'pending') || [];
  const confirmedReservations = reservations?.filter(r => ['confirmed', 'presence_confirmed'].includes(r.status)) || [];
  const pastReservations = reservations?.filter(r => ['rejected', 'cancelled_by_user', 'cancelled_by_admin', 'expired'].includes(r.status)) || [];
  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelReservation.mutateAsync(cancelId);
    setCancelId(null);
  };
  const ReservationCard = ({
    reservation
  }: {
    reservation: NonNullable<typeof reservations>[0];
  }) => {
    const isPaid = isReservationPaid(reservation.id);
    const showPayButton = reservation.status === 'confirmed' && !isPaid;
    
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
                  disabled={isProcessingPayment}
                >
                  <CreditCard className="w-4 h-4" />
                </Button>
              )}
              {reservation.status === 'pending' && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelId(reservation.id)}>
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
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
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
                    <strong>Importante:</strong> Apresente o código <span className="font-mono font-bold">{viewReservation.code}</span> no momento do check-in.
                  </p>
                </div>}
            </div>}
        </DialogContent>
      </Dialog>
    </AppLayout>;
}