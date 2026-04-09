import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCancellationRequests, useApproveRefund, useMarkRefundCompleted, isWithin48Hours } from '@/hooks/useRefunds';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Calendar, Check, Clock, Copy, DollarSign, MapPin, Search, User, Key } from 'lucide-react';
import { copyToClipboard } from '@/lib/native';

export function AdminRefundsContent() {
  const { data: requests, isLoading } = useCancellationRequests();
  const approveRefund = useApproveRefund();
  const markCompleted = useMarkRefundCompleted();
  const [search, setSearch] = useState('');
  const [approveDialog, setApproveDialog] = useState<NonNullable<typeof requests>[0] | null>(null);
  const [refundAmount, setRefundAmount] = useState('');

  const filtered = requests?.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.user_profile?.full_name?.toLowerCase().includes(s) ||
      r.user_profile?.email?.toLowerCase().includes(s) ||
      r.code.toLowerCase().includes(s) ||
      r.location?.name?.toLowerCase().includes(s);
  });

  const pendingRefunds = filtered?.filter(r => r.refund_status === 'none' || r.refund_status === 'pending') || [];
  const approvedRefunds = filtered?.filter(r => r.refund_status === 'approved') || [];
  const completedRefunds = filtered?.filter(r => r.refund_status === 'completed') || [];

  const openApproveDialog = (r: NonNullable<typeof requests>[0]) => {
    const within48 = isWithin48Hours(r.reservation_date, r.start_time, r.cancelled_at);
    // If cancelled 48h+ before, suggest full refund
    setRefundAmount(within48 ? '0' : String(r.total_price));
    setApproveDialog(r);
  };

  const handleApprove = async () => {
    if (!approveDialog) return;
    await approveRefund.mutateAsync({ id: approveDialog.id, refundAmount: parseFloat(refundAmount) || 0 });
    setApproveDialog(null);
    setRefundAmount('');
  };

  const RefundBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      none: { label: 'Aguardando', variant: 'secondary' },
      pending: { label: 'Aguardando', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      completed: { label: 'Concluído', variant: 'outline' },
    };
    const info = map[status] || map.none;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const RequestCard = ({ request }: { request: NonNullable<typeof requests>[0] }) => {
    const within48 = isWithin48Hours(request.reservation_date, request.start_time, request.cancelled_at);
    const refundStatus = request.refund_status || 'none';
    const pixKey = request.refund_pix_key;
    const pixName = request.refund_pix_name;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{request.code}</span>
                <StatusBadge status={request.status} />
                <RefundBadge status={refundStatus} />
                {within48 && request.status === 'cancelled_by_user' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Cancelado &lt;48h
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{request.user_profile?.full_name}</span>
                <span className="text-sm text-muted-foreground">({request.user_profile?.email})</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{request.location?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(request.reservation_date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{request.start_time.substring(0, 5)} - {request.end_time.substring(0, 5)}</span>
                </div>
                <span className="text-primary font-medium">R$ {request.total_price.toFixed(2)}</span>
              </div>

              {/* PIX info from user */}
              {pixKey && (
                <div className="p-2 bg-muted rounded-lg text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Chave PIX:</span>
                    <button
                      onClick={() => copyToClipboard(pixKey, 'Chave PIX')}
                      className="font-mono inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {pixKey}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  {pixName && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Recebedor:</span>
                      <span>{pixName}</span>
                    </div>
                  )}
                </div>
              )}

              {refundStatus === 'approved' && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="font-medium text-success">Reembolso aprovado: R$ {(request.refund_amount || 0).toFixed(2)}</span>
                </div>
              )}

              {request.cancelled_at && (
                <p className="text-xs text-muted-foreground">
                  Cancelado em {format(new Date(request.cancelled_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {(refundStatus === 'none' || refundStatus === 'pending') && (
                <Button size="sm" onClick={() => openApproveDialog(request)}>
                  <DollarSign className="w-4 h-4 mr-1" />
                  Aprovar
                </Button>
              )}
              {refundStatus === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-success hover:text-success"
                  onClick={() => markCompleted.mutateAsync({ id: request.id })}
                  disabled={markCompleted.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Concluir
                </Button>
              )}
            </div>
          </div>

          {/* Warning for <48h user cancellations */}
          {within48 && request.status === 'cancelled_by_user' && (refundStatus === 'none' || refundStatus === 'pending') && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Atenção: Cancelamento com menos de 48h de antecedência</p>
                <p className="text-muted-foreground mt-1">
                  O usuário cancelou esta reserva com menos de 48 horas de antecedência do horário reservado.
                  Verifique a política de cancelamento antes de definir o valor do reembolso.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Reembolsos e Cancelamentos"
        description="Gerencie solicitações de cancelamento e reembolso"
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por usuário, código ou local..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4 bg-background">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingRefunds.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovados ({approvedRefunds.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídos ({completedRefunds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRefunds.length === 0 ? (
              <EmptyState icon={DollarSign} title="Nenhum reembolso pendente" description="Não há solicitações aguardando aprovação" />
            ) : pendingRefunds.map(r => <RequestCard key={r.id} request={r} />)}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedRefunds.length === 0 ? (
              <EmptyState icon={DollarSign} title="Nenhum reembolso aprovado" description="Reembolsos aprovados aguardando transferência aparecerão aqui" />
            ) : approvedRefunds.map(r => <RequestCard key={r.id} request={r} />)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRefunds.length === 0 ? (
              <EmptyState icon={DollarSign} title="Nenhum reembolso concluído" description="Histórico de reembolsos concluídos aparecerá aqui" />
            ) : completedRefunds.map(r => <RequestCard key={r.id} request={r} />)}
          </TabsContent>
        </Tabs>
      )}

      {/* Approve Refund Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => { setApproveDialog(null); setRefundAmount(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Reembolso</DialogTitle>
            <DialogDescription>
              Defina o valor a ser reembolsado ao usuário.
            </DialogDescription>
          </DialogHeader>

          {approveDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p><strong>Reserva:</strong> {approveDialog.code}</p>
                <p><strong>Usuário:</strong> {approveDialog.user_profile?.full_name}</p>
                <p><strong>Valor Total:</strong> R$ {approveDialog.total_price.toFixed(2)}</p>
                {approveDialog.refund_pix_key && (
                  <>
                    <p><strong>Chave PIX:</strong> {approveDialog.refund_pix_key}</p>
                    <p><strong>Recebedor:</strong> {approveDialog.refund_pix_name || 'Não informado'}</p>
                  </>
                )}
              </div>

              {isWithin48Hours(approveDialog.reservation_date, approveDialog.start_time, approveDialog.cancelled_at) &&
                approveDialog.status === 'cancelled_by_user' && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Cancelamento com menos de 48h</p>
                    <p className="text-muted-foreground mt-1">
                      O reembolso pode ser parcial ou negado conforme a política de cancelamento.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refund-amount">Valor do Reembolso (R$)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0}
                  max={approveDialog.total_price}
                  step={0.01}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo: R$ {approveDialog.total_price.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveDialog(null); setRefundAmount(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={approveRefund.isPending}>
              {approveRefund.isPending ? 'Aprovando...' : 'Aprovar Reembolso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminRefunds() {
  return <AppLayout><AdminRefundsContent /></AppLayout>;
}
