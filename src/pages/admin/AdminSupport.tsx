import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { SupportChat } from '@/components/support/SupportChat';
import { useAdminTickets, useAcceptTicket, useResolveTicket, useSupportRealtime } from '@/hooks/useSupport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserCheck, CheckCircle, MessageSquare, Star } from 'lucide-react';
import type { SupportTicket } from '@/hooks/useSupport';
import { AppLayout } from '@/components/layout/AppLayout';

export function AdminSupportContent() {
  const { data: tickets = [], isLoading } = useAdminTickets();
  const acceptTicket = useAcceptTicket();
  const resolveTicket = useResolveTicket();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useSupportRealtime(selectedTicket?.id);

  const waiting = tickets.filter(t => t.status === 'waiting');
  const inProgress = tickets.filter(t => t.status === 'in_progress');
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  if (selectedTicket) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{selectedTicket.subject}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedTicket.profiles?.full_name || 'Usuário'} • {selectedTicket.profiles?.email}
            </p>
            <TicketStatusBadge status={selectedTicket.status} />
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            {selectedTicket.status === 'waiting' && (
              <Button size="sm" onClick={() => {
                acceptTicket.mutate(selectedTicket.id, {
                  onSuccess: () => setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null),
                });
              }} disabled={acceptTicket.isPending}>
                <UserCheck className="w-4 h-4 mr-1" /> Aceitar
              </Button>
            )}
            {selectedTicket.status === 'in_progress' && (
              <Button size="sm" variant="outline" onClick={() => {
                resolveTicket.mutate(selectedTicket.id, {
                  onSuccess: () => setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null),
                });
              }} disabled={resolveTicket.isPending}>
                <CheckCircle className="w-4 h-4 mr-1" /> Resolver
              </Button>
            )}
          </div>
        </div>
        <SupportChat
          ticketId={selectedTicket.id}
          ticketStatus={selectedTicket.status}
          isAdmin
          onBack={() => setSelectedTicket(null)}
        />
      </div>
    );
  }

  const TicketRow = ({ ticket }: { ticket: SupportTicket }) => (
    <button
      onClick={() => setSelectedTicket(ticket)}
      className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{ticket.subject}</span>
        <TicketStatusBadge status={ticket.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        {ticket.profiles?.full_name || 'Usuário'} • {format(new Date(ticket.created_at), "dd/MM HH:mm", { locale: ptBR })}
      </p>
      {ticket.rating && (
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: ticket.rating }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
      )}
    </button>
  );

  return (
    <div className="p-3 sm:p-4 space-y-4 flex-1 min-h-0 overflow-auto">
      <Tabs defaultValue="waiting">
        <TabsList className="w-full flex">
          <TabsTrigger value="waiting" className="flex-1 text-xs sm:text-sm px-2 sm:px-3">
            Aguard. {waiting.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{waiting.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex-1 text-xs sm:text-sm px-2 sm:px-3">
            Atend. ({inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 text-xs sm:text-sm px-2 sm:px-3">
            Resolv. ({resolved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="space-y-2 mt-3">
          {waiting.length === 0 && <EmptyState text="Nenhum ticket aguardando" />}
          {waiting.map(t => <TicketRow key={t.id} ticket={t} />)}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-2 mt-3">
          {inProgress.length === 0 && <EmptyState text="Nenhum ticket em atendimento" />}
          {inProgress.map(t => <TicketRow key={t.id} ticket={t} />)}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-2 mt-3">
          {resolved.length === 0 && <EmptyState text="Nenhum ticket resolvido" />}
          {resolved.map(t => <TicketRow key={t.id} ticket={t} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export default function AdminSupport() {
  return (
    <AppLayout>
      <AdminSupportContent />
    </AppLayout>
  );
}
