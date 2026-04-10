import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Headset, Plus, MessageSquare } from 'lucide-react';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { SupportChat } from '@/components/support/SupportChat';
import { RatingDialog } from '@/components/support/RatingDialog';
import { useUserTickets, useCreateTicket, useRateTicket, useSupportRealtime } from '@/hooks/useSupport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SupportTicket } from '@/hooks/useSupport';
import { PageHeader } from '@/components/ui/page-header';

export default function Support() {
  const { data: tickets = [], isLoading } = useUserTickets();
  const createTicket = useCreateTicket();
  const rateTicket = useRateTicket();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ratingTicket, setRatingTicket] = useState<SupportTicket | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useSupportRealtime(selectedTicket?.id);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    const ticket = await createTicket.mutateAsync({ subject: subject.trim(), message: message.trim() });
    setNewTicketOpen(false);
    setSubject('');
    setMessage('');
    setSelectedTicket(ticket as any);
  };

  const handleRate = (rating: number) => {
    if (!ratingTicket) return;
    rateTicket.mutate({ ticketId: ratingTicket.id, rating }, {
      onSuccess: () => setRatingTicket(null),
    });
  };

  if (selectedTicket) {
    return (
      <AppLayout>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Headset className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">{selectedTicket.subject}</h2>
                <TicketStatusBadge status={selectedTicket.status} />
              </div>
            </div>
          </div>
          <SupportChat ticketId={selectedTicket.id} ticketStatus={selectedTicket.status} onBack={() => setSelectedTicket(null)} />
          {selectedTicket.status === 'resolved' && !selectedTicket.rating && (
            <div className="p-3 border-t border-border flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setRatingTicket(selectedTicket)}>⭐ Avaliar atendimento</Button>
            </div>
          )}
        </div>
        <RatingDialog open={!!ratingTicket} onOpenChange={() => setRatingTicket(null)} onRate={handleRate} loading={rateTicket.isPending} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Como podemos ajudar?"
          description="Nossa equipe está pronta para responder suas dúvidas."
          action={
            <Button onClick={() => setNewTicketOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Solicitação
            </Button>
          }
        />

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5">
              <Headset className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 font-serif">Nenhuma solicitação</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Você não tem solicitações de suporte ainda. Clique abaixo para abrir uma nova.
            </p>
            <Button onClick={() => setNewTicketOpen(true)} className="rounded-xl">
              Abrir Solicitação
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full text-left p-4 rounded-2xl bg-card shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{ticket.subject}</span>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {ticket.status === 'resolved' && !ticket.rating && (
                <p className="text-xs text-warning mt-1">⭐ Avalie este atendimento</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Nova Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Assunto" value={subject} onChange={e => setSubject(e.target.value)} />
            <Textarea placeholder="Descreva o que você precisa..." value={message} onChange={e => setMessage(e.target.value)} rows={4} className="rounded-[10px] bg-accent border-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTicketOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!subject.trim() || !message.trim() || createTicket.isPending}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
