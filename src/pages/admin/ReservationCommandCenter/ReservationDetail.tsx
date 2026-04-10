import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, MapPin, Clock, DollarSign, Key, Copy, Check, X, Ban, UserCheck, MessageSquare, ChevronDown, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/native';
import { useUpdateReservationStatus, useCancelReservation } from '@/hooks/useReservations';
import { useMarkPaymentAsPaid } from '@/hooks/usePayments';
import { useApproveRefund, useMarkRefundCompleted, isWithin48Hours } from '@/hooks/useRefunds';
import { usePerformCheckin } from '@/hooks/useCheckin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ReservationWithDetails } from './types';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'transfer', label: 'Transferência' },
];

interface DetailProps {
  reservation: ReservationWithDetails;
}

export function ReservationDetail({ reservation: r }: DetailProps) {
  const [confirmAction, setConfirmAction] = useState<'payment' | 'reject' | 'cancel' | 'refund' | 'checkin' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState(r.admin_notes || '');
  const [notesDirty, setNotesDirty] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [cancelRefundAmount, setCancelRefundAmount] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const updateStatus = useUpdateReservationStatus();
  const cancelReservation = useCancelReservation({ asAdmin: true });
  const markAsPaid = useMarkPaymentAsPaid();
  const approveRefund = useApproveRefund();
  const markRefundCompleted = useMarkRefundCompleted();
  const performCheckin = usePerformCheckin();

  const payment = r.payment;
  const isPaid = payment?.is_paid;
  const isCancelled = ['cancelled_by_user', 'cancelled_by_admin'].includes(r.status);
  const isRefundPending = isCancelled && (r.refund_status === 'pending' || r.refund_status === 'none');
  const isRefundApproved = isCancelled && r.refund_status === 'approved';
  const today = new Date().toISOString().split('T')[0];
  const isToday = r.reservation_date === today;

  const handleConfirmPayment = async () => {
    if (!payment) return;
    await markAsPaid.mutateAsync({ id: payment.id, paymentMethod, notes: paymentNotes || undefined });
    setConfirmAction(null);
    setPaymentNotes('');
  };

  const handleReject = async () => {
    await updateStatus.mutateAsync({ id: r.id, status: 'rejected', adminNotes: rejectNotes });
    setConfirmAction(null);
    setRejectNotes('');
  };

  const handleCancel = async () => {
    const amount = cancelRefundAmount ? parseFloat(cancelRefundAmount) : undefined;
    await cancelReservation.mutateAsync({ id: r.id, refundAmount: amount });
    setConfirmAction(null);
    setCancelRefundAmount('');
  };

  const handleApproveRefund = async () => {
    await approveRefund.mutateAsync({ id: r.id, refundAmount: parseFloat(refundAmount) || 0 });
    setConfirmAction(null);
    setRefundAmount('');
  };

  const handleCheckin = async () => {
    await performCheckin.mutateAsync({ reservationId: r.id, code: r.code });
    setConfirmAction(null);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', r.id);
      if (error) throw error;
      toast.success('Observação salva!');
      setNotesDirty(false);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const within48 = isCancelled ? isWithin48Hours(r.reservation_date, r.start_time, r.cancelled_at) : false;

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono tracking-wider">{r.code}</h2>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Criada em {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>

        {/* Section 1: Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{r.user_profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{r.user_profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm">{r.location?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm">{format(new Date(r.reservation_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm">{r.start_time.substring(0, 5)} – {r.end_time.substring(0, 5)}</p>
          </div>
        </div>

        {/* Section 2: Financial */}
        <div className="p-4 bg-muted/50 rounded-xl space-y-3 border border-border/30">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Financeiro</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-semibold">R$ {r.total_price.toFixed(2)}</span>
          </div>

          {/* Pending payment */}
          {r.status === 'pending' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="text-warning font-medium">⏳ Aguardando</span>
              </div>
              {payment?.receipt_url && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setReceiptOpen(!receiptOpen)}
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {receiptOpen ? 'Ocultar comprovante' : 'Ver comprovante'}
                  </Button>
                  {receiptOpen && (
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img src={payment.receipt_url} alt="Comprovante" className="max-h-60 rounded-lg border object-contain" />
                    </a>
                  )}
                </div>
              )}

              {/* Inline confirm payment */}
              {confirmAction === 'payment' ? (
                <div className="p-3 bg-background rounded-lg border space-y-3">
                  <p className="text-sm font-medium">Confirmar pagamento de R$ {r.total_price.toFixed(2)}?</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Forma de pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)}>Cancelar</Button>
                    <Button size="sm" onClick={handleConfirmPayment} disabled={markAsPaid.isPending}>
                      {markAsPaid.isPending ? 'Confirmando...' : 'Confirmar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" className="w-full" onClick={() => setConfirmAction('payment')}>
                  <Check className="w-4 h-4 mr-1" />
                  Confirmar pagamento
                </Button>
              )}
            </>
          )}

          {/* Paid */}
          {isPaid && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="text-success font-medium">✅ Pago {payment?.paid_at && `em ${format(new Date(payment.paid_at), 'dd/MM/yyyy')}`}</span>
              </div>
              {payment?.receipt_url && (
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setReceiptOpen(!receiptOpen)}>
                  <ImageIcon className="w-3 h-3 mr-1" />
                  {receiptOpen ? 'Ocultar' : 'Ver comprovante'}
                </Button>
              )}
              {receiptOpen && payment?.receipt_url && (
                <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={payment.receipt_url} alt="Comprovante" className="max-h-60 rounded-lg border object-contain" />
                </a>
              )}
            </>
          )}

          {/* Cancelled - Refund info */}
          {isCancelled && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cancelada em</span>
                <span>{r.cancelled_at ? format(new Date(r.cancelled_at), "dd/MM/yyyy 'às' HH:mm") : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cancelada por</span>
                <span>{r.status === 'cancelled_by_admin' ? 'Administrador' : 'Usuário'}</span>
              </div>

              {within48 && r.status === 'cancelled_by_user' && (
                <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-lg text-xs">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span className="text-warning">Cancelamento com menos de 48h de antecedência</span>
                </div>
              )}

              {/* PIX info */}
              {r.refund_pix_key && (
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-xs text-muted-foreground">↩️ Reembolso</p>
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono text-xs">{r.refund_pix_key}</span>
                    <button onClick={() => copyToClipboard(r.refund_pix_key!, 'Chave PIX')} className="hover:text-primary">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  {r.refund_pix_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{r.refund_pix_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Refund status & actions */}
              {isRefundPending && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reembolso</span>
                    <span className="text-warning">⏳ Aguardando aprovação</span>
                  </div>
                  {confirmAction === 'refund' ? (
                    <div className="p-3 bg-background rounded-lg border space-y-3">
                      <p className="text-sm font-medium">Aprovar reembolso</p>
                      <div className="space-y-2">
                        <Label className="text-xs">Valor do reembolso (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={r.total_price}
                          step={0.01}
                          value={refundAmount}
                          onChange={e => setRefundAmount(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">Máximo: R$ {r.total_price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)}>Cancelar</Button>
                        <Button size="sm" onClick={handleApproveRefund} disabled={approveRefund.isPending}>
                          {approveRefund.isPending ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const suggest = within48 ? '0' : String(r.total_price);
                        setRefundAmount(suggest);
                        setConfirmAction('refund');
                      }}
                    >
                      ↩️ Aprovar reembolso
                    </Button>
                  )}
                </>
              )}

              {isRefundApproved && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reembolso</span>
                    <span className="text-success font-medium">✅ Aprovado — R$ {(r.refund_amount || 0).toFixed(2)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-success hover:text-success"
                    onClick={() => markRefundCompleted.mutateAsync({ id: r.id })}
                    disabled={markRefundCompleted.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Marcar como concluído
                  </Button>
                </>
              )}

              {r.refund_status === 'completed' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reembolso</span>
                  <span className="text-success font-medium">✅ Concluído — R$ {(r.refund_amount || 0).toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Section 3: Admin Actions */}
        {r.status === 'pending' && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmAction('reject')}>
              <X className="w-4 h-4 mr-1" />
              Recusar
            </Button>
            <Button variant="outline" size="sm" className="text-muted-foreground" onClick={() => {
              setCancelRefundAmount(String(r.total_price));
              setConfirmAction('cancel');
            }}>
              <Ban className="w-4 h-4 mr-1" />
              Cancelar reserva
            </Button>
          </div>
        )}

        {r.status === 'confirmed' && (
          <div className="flex gap-2 flex-wrap">
            {isToday && (
              <Button size="sm" onClick={() => setConfirmAction('checkin')}>
                <UserCheck className="w-4 h-4 mr-1" />
                Fazer check-in
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
              setCancelRefundAmount(String(r.total_price));
              setConfirmAction('cancel');
            }}>
              <Ban className="w-4 h-4 mr-1" />
              Cancelar reserva
            </Button>
          </div>
        )}

        {/* Inline action dialogs */}
        {confirmAction === 'reject' && (
          <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20 space-y-3">
            <p className="text-sm font-medium text-destructive">Recusar reserva {r.code}</p>
            <div className="space-y-2">
              <Label className="text-xs">Justificativa (obrigatória)</Label>
              <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Motivo da recusa..." rows={2} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)}>Voltar</Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={updateStatus.isPending || !rejectNotes.trim()}>
                {updateStatus.isPending ? 'Processando...' : 'Confirmar recusa'}
              </Button>
            </div>
          </div>
        )}

        {confirmAction === 'cancel' && (
          <div className="p-3 bg-muted rounded-lg border space-y-3">
            <p className="text-sm font-medium">Cancelar reserva {r.code}</p>
            <div className="space-y-2">
              <Label className="text-xs">Valor do reembolso (R$)</Label>
              <Input
                type="number"
                min={0}
                max={r.total_price}
                step={0.01}
                value={cancelRefundAmount}
                onChange={e => setCancelRefundAmount(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)}>Voltar</Button>
              <Button size="sm" variant="destructive" onClick={handleCancel} disabled={cancelReservation.isPending}>
                {cancelReservation.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
              </Button>
            </div>
          </div>
        )}

        {confirmAction === 'checkin' && (
          <div className="p-3 bg-success/5 rounded-lg border border-success/20 space-y-3">
            <p className="text-sm font-medium text-success">Confirmar presença para {r.code}?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)}>Voltar</Button>
              <Button size="sm" onClick={handleCheckin} disabled={performCheckin.isPending}>
                {performCheckin.isPending ? 'Confirmando...' : 'Confirmar check-in'}
              </Button>
            </div>
          </div>
        )}

        {/* Section 4: Notes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Observações internas</span>
          </div>
          {r.user_notes && (
            <div className="p-2 bg-muted/50 rounded-lg text-xs">
              <span className="text-muted-foreground">Nota do usuário: </span>
              {r.user_notes}
            </div>
          )}
          <Textarea
            value={adminNotes}
            onChange={e => { setAdminNotes(e.target.value); setNotesDirty(true); }}
            placeholder="Adicionar observação interna…"
            rows={2}
            className="text-sm"
          />
          {notesDirty && (
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? 'Salvando...' : 'Salvar nota'}
            </Button>
          )}
        </div>

        {/* Section 5: Audit trail */}
        <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn('w-4 h-4 transition-transform', auditOpen && 'rotate-180')} />
            Ver histórico de eventos
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-1 text-xs text-muted-foreground border-l-2 border-border/50 pl-3">
              <p>{format(new Date(r.created_at), 'dd/MM HH:mm')} — Reserva criada</p>
              {r.status === 'confirmed' && (
                <p>{format(new Date(r.updated_at), 'dd/MM HH:mm')} — Reserva confirmada</p>
              )}
              {r.status === 'rejected' && (
                <p>{format(new Date(r.updated_at), 'dd/MM HH:mm')} — Reserva recusada</p>
              )}
              {isCancelled && r.cancelled_at && (
                <p>{format(new Date(r.cancelled_at), 'dd/MM HH:mm')} — Reserva cancelada ({r.status === 'cancelled_by_admin' ? 'admin' : 'usuário'})</p>
              )}
              {r.status === 'expired' && (
                <p>{format(new Date(r.updated_at), 'dd/MM HH:mm')} — Reserva expirada</p>
              )}
              {r.status === 'presence_confirmed' && (
                <p>{format(new Date(r.updated_at), 'dd/MM HH:mm')} — Presença confirmada</p>
              )}
              {isPaid && payment?.paid_at && (
                <p>{format(new Date(payment.paid_at), 'dd/MM HH:mm')} — Pagamento confirmado</p>
              )}
              {r.refund_status === 'approved' && (
                <p>Reembolso aprovado — R$ {(r.refund_amount || 0).toFixed(2)}</p>
              )}
              {r.refund_status === 'completed' && (
                <p>Reembolso concluído</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ScrollArea>
  );
}
