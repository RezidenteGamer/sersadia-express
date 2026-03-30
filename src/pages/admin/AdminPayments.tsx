import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayments, useMarkPaymentAsPaid, Payment } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Search, Check, DollarSign, Calendar, User, MapPin, Image as ImageIcon } from 'lucide-react';
const PAYMENT_METHODS = [{
  value: 'pix',
  label: 'PIX'
}, {
  value: 'cash',
  label: 'Dinheiro'
}, {
  value: 'credit_card',
  label: 'Cartão de Crédito'
}, {
  value: 'debit_card',
  label: 'Cartão de Débito'
}, {
  value: 'transfer',
  label: 'Transferência'
}];
export function AdminPaymentsContent() {
  const [search, setSearch] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentNotes, setPaymentNotes] = useState('');
  const {
    data: allPayments,
    isLoading: loadingAll
  } = usePayments();
  const {
    data: pendingPayments,
    isLoading: loadingPending
  } = usePayments({
    isPaid: false
  });
  const {
    data: paidPayments,
    isLoading: loadingPaid
  } = usePayments({
    isPaid: true
  });
  const markAsPaid = useMarkPaymentAsPaid();
  const handleMarkPaid = async () => {
    if (!paymentDialog) return;
    try {
      await markAsPaid.mutateAsync({
        id: paymentDialog.id,
        paymentMethod,
        notes: paymentNotes || undefined
      });
      setPaymentDialog(null);
      setPaymentMethod('pix');
      setPaymentNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };
  const filterPayments = (payments: Payment[] | undefined) => {
    if (!payments) return [];
    if (!search) return payments;
    const searchLower = search.toLowerCase();
    return payments.filter(p => p.user_profile?.full_name?.toLowerCase().includes(searchLower) || p.user_profile?.email?.toLowerCase().includes(searchLower) || p.reservation?.location?.name?.toLowerCase().includes(searchLower));
  };
  const PaymentCard = ({
    payment,
    showPaidButton = false
  }: {
    payment: Payment;
    showPaidButton?: boolean;
  }) => <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={payment.is_paid ? 'default' : 'secondary'}>
                {payment.is_paid ? 'Pago' : 'Pendente'}
              </Badge>
              {payment.payment_method && <Badge variant="outline">
                  {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                </Badge>}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{payment.user_profile?.full_name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{payment.reservation?.location?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{payment.reservation?.reservation_date && format(new Date(payment.reservation.reservation_date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex items-center gap-1 text-primary font-medium">
                <DollarSign className="w-4 h-4" />
                <span>R$ {payment.amount.toFixed(2)}</span>
              </div>
            </div>
            {payment.is_paid && payment.paid_at && <p className="text-xs text-muted-foreground">
                Pago em {format(new Date(payment.paid_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>}
            {payment.notes && <p className="text-sm text-muted-foreground italic">{payment.notes}</p>}
            {(payment as any).receipt_url && (
              <a href={(payment as any).receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ImageIcon className="w-3 h-3" />
                Ver comprovante
              </a>
            )}
          </div>
          
          {showPaidButton && !payment.is_paid && <Button variant="outline" className="text-success hover:text-success" onClick={() => setPaymentDialog(payment)}>
              <Check className="w-4 h-4 mr-2" />
              Registrar Pagamento
            </Button>}
        </div>
      </CardContent>
    </Card>;
  const pendingCount = pendingPayments?.length || 0;
  const paidCount = paidPayments?.length || 0;
  const totalPending = pendingPayments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  return <>
      <PageHeader title="Gerenciar Pagamentos" description="Registre e acompanhe os pagamentos das reservas" />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <CreditCard className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <DollarSign className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Receber</p>
              <p className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagos</p>
              <p className="text-2xl font-bold">{paidCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder="Buscar por usuário ou local..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="pending" className="space-y-4 bg-background">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="paid">Pagos ({paidCount})</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div> : filterPayments(pendingPayments).length > 0 ? filterPayments(pendingPayments).map(p => <PaymentCard key={p.id} payment={p} showPaidButton />) : <EmptyState icon={CreditCard} title="Nenhum pagamento pendente" description="Todos os pagamentos foram registrados" />}
        </TabsContent>
        
        <TabsContent value="paid" className="space-y-4">
          {loadingPaid ? <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div> : filterPayments(paidPayments).length > 0 ? filterPayments(paidPayments).map(p => <PaymentCard key={p.id} payment={p} />) : <EmptyState icon={CreditCard} title="Nenhum pagamento registrado" description="Os pagamentos registrados aparecerão aqui" />}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {loadingAll ? <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div> : filterPayments(allPayments).length > 0 ? filterPayments(allPayments).map(p => <PaymentCard key={p.id} payment={p} showPaidButton />) : <EmptyState icon={CreditCard} title="Nenhum pagamento" description="Os pagamentos aparecerão aqui" />}
        </TabsContent>
      </Tabs>

      {/* Register Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => {
      setPaymentDialog(null);
      setPaymentNotes('');
    }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          
          {paymentDialog && <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p><strong>Usuário:</strong> {paymentDialog.user_profile?.full_name}</p>
                <p><strong>Local:</strong> {paymentDialog.reservation?.location?.name}</p>
                <p><strong>Valor:</strong> <span className="text-primary font-bold">R$ {paymentDialog.amount.toFixed(2)}</span></p>
                {(paymentDialog as any).receipt_url && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Comprovante:</p>
                    <a href={(paymentDialog as any).receipt_url} target="_blank" rel="noopener noreferrer">
                      <img src={(paymentDialog as any).receipt_url} alt="Comprovante" className="max-h-48 rounded border object-contain" />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Adicione observações..." rows={2} />
              </div>
            </div>}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setPaymentDialog(null);
            setPaymentNotes('');
          }}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPaid} disabled={markAsPaid.isPending}>
              {markAsPaid.isPending ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}

export default function AdminPayments() {
  return <AppLayout><AdminPaymentsContent /></AppLayout>;
}