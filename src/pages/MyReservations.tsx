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
import { motion } from 'framer-motion';

export default function MyReservations() {
  const { data: reservations, isLoading } = useUserReservations();
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

  const isReservationPaid = (reservationId: string) => {
    return payments?.some(p => p.reservation_id === reservationId && p.is_paid);
  };

  const handlePayment = (reservation: NonNullable<typeof reservations>[0]) => {
    setPixPaymentReservation(reservation);
  };

  if (isLoading) {
    return <AppLayout><LoadingSpinner /></AppLayout>;
  }

  const pendingReservations = reservations?.filter(r => r.status === 'pending') || [];
  const confirmedReservations = reservations?.filter(r => ['confirmed', 'presence_confirmed'].includes(r.status)) || [];
  const pastReservations = reservations?.filter(r => ['rejected', 'cancelled_by_user', 'cancelled_by_admin', 'expired'].includes(r.status)) || [];

  const handleOpenCancel = (reservation: NonNullable<typeof reservations>[0]) => {
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

  const ReservationCard = ({ reservation }: { reservation: NonNullable<typeof reservations>[0] }) => {
    const isPaid = isReservationPaid(reservation.id);
    const showPayButton = ['pending', 'confirmed', 'presence_confirmed'].includes(reservation.status) && !isPaid;

    return (
      <motion.div whileHover={{ y: -2 }}>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {reservation.location?.images?.[0] ? (
                    <img src={reservation.location.images[0]} alt={reservation.location.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{reservation.location?.name || 'Local'}</h3>

                  {['confirmed', 'presence_confirmed'].includes(reservation.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(reservation.code, 'Código da reserva'); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg hover:bg-accent/80 transition-colors group w-fit"
                    >
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium block">Check-in</span>
                        <span className="font-mono font-bold text-primary text-base tracking-[0.2em]">{reservation.code}</span>
                      </div>
                      <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(reservation.reservation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={reservation.status} />
                    {isPaid && <span className="text-[11px] px-2 py-0.5 bg-success/10 text-success rounded-full font-medium">Pago</span>}
                    {!isPaid && <span className="text-[11px] px-2 py-0.5 bg-warning/10 text-warning rounded-full font-medium">Pgto Pendente</span>}
                    <span className="text-sm font-semibold text-primary">R$ {reservation.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewReservation(reservation)}>
                  <Eye className="w-4 h-4" />
                </Button>
                {showPayButton && (
                  <Button size="icon" className="h-8 w-8" onClick={() => handlePayment(reservation)}>
                    <CreditCard className="w-4 h-4" />
                  </Button>
                )}
                {['pending', 'confirmed'].includes(reservation.status) && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleOpenCancel(reservation)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <PageHeader title="Minhas Reservas" description="Acompanhe todas as suas reservas" />

      <Tabs defaultValue="confirmed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="confirmed">Confirmadas ({confirmedReservations.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingReservations.length})</TabsTrigger>
          <TabsTrigger value="history">Histórico ({pastReservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="confirmed" className="space-y-3">
          {confirmedReservations.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhuma reserva confirmada" description="Suas reservas confirmadas aparecerão aqui" tint="green" action={{ label: 'Fazer Reserva', onClick: () => navigate('/locations') }} />
          ) : confirmedReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingReservations.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhum pagamento aguardando" description="Suas reservas aguardando aprovação aparecerão aqui" tint="amber" />
          ) : pendingReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {pastReservations.length === 0 ? (
            <EmptyState icon={Calendar} title="Seu histórico aparecerá aqui" description="Seu histórico de reservas aparecerá aqui" />
          ) : pastReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => { setCancelId(null); setCancelReservationData(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Cancelar Reserva</DialogTitle>
            <DialogDescription>Informe seus dados PIX para receber o reembolso.</DialogDescription>
          </DialogHeader>

          {isFullRefund ? (
            <div className="flex items-start gap-2 p-3 bg-success/10 rounded-xl text-sm">
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success">Reembolso total</p>
                <p className="text-muted-foreground mt-1">Cancelamento com mais de 48h de antecedência. Reembolso integral (R$ {cancelReservationData?.total_price.toFixed(2)}).</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-xl text-sm">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Cancelamento com menos de 48h</p>
                <p className="text-muted-foreground mt-1">O valor do reembolso será definido pela administração.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-pix-key">Chave PIX para reembolso *</Label>
              <Input id="cancel-pix-key" value={cancelPixKey} onChange={(e) => setCancelPixKey(e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-pix-name">Nome do recebedor *</Label>
              <Input id="cancel-pix-name" value={cancelPixName} onChange={(e) => setCancelPixName(e.target.value)} placeholder="Nome completo do titular da conta" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelId(null); setCancelReservationData(null); }}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelReservation.isPending || !cancelPixKey.trim() || !cancelPixName.trim()}>
              {cancelReservation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewReservation} onOpenChange={() => setViewReservation(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {viewReservation && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl space-y-2 bg-accent">
                <p><strong>Código:</strong> {viewReservation.code}</p>
                <p><strong>Local:</strong> {viewReservation.location?.name}</p>
                <p><strong>Data:</strong> {format(new Date(viewReservation.reservation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                <p><strong>Horário:</strong> {viewReservation.start_time.substring(0, 5)} - {viewReservation.end_time.substring(0, 5)}</p>
                <p><strong>Valor:</strong> R$ {viewReservation.total_price.toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <StatusBadge status={viewReservation.status} />
                </div>
              </div>
              {viewReservation.user_notes && (
                <div>
                  <p className="font-medium mb-1 text-sm">Suas Observações:</p>
                  <p className="text-sm text-muted-foreground">{viewReservation.user_notes}</p>
                </div>
              )}
              {viewReservation.admin_notes && (
                <div>
                  <p className="font-medium mb-1 text-sm">Observações da Administração:</p>
                  <p className="text-sm text-muted-foreground">{viewReservation.admin_notes}</p>
                </div>
              )}
              {viewReservation.status === 'confirmed' && (
                <div className="p-4 bg-primary/5 rounded-xl">
                  <p className="text-sm">
                    <strong>Importante:</strong> Apresente o código{' '}
                    <button onClick={() => copyToClipboard(viewReservation.code, 'Código')} className="font-mono font-bold inline-flex items-center gap-1 hover:text-primary transition-colors">
                      {viewReservation.code} <Copy className="w-3 h-3" />
                    </button>{' '}no momento do check-in.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </AppLayout>
  );
}
