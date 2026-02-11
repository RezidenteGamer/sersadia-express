import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Lock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketMessages, useSendMessage, useMarkMessagesRead, useSupportRealtime } from '@/hooks/useSupport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportChatProps {
  ticketId: string;
  ticketStatus: string;
  isAdmin?: boolean;
  onBack?: () => void;
}

export function SupportChat({ ticketId, ticketStatus, isAdmin = false, onBack }: SupportChatProps) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useTicketMessages(ticketId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useSupportRealtime(ticketId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (ticketId && messages.length > 0) {
      markRead.mutate(ticketId);
    }
  }, [ticketId, messages.length]);

  const canSend = ticketStatus === 'waiting' || ticketStatus === 'in_progress';

  const handleSend = () => {
    if (!text.trim() || !canSend) return;
    sendMessage.mutate({ ticketId, message: text.trim(), isInternal: isAdmin && isInternal });
    setText('');
    setIsInternal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      {onBack && (
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">Voltar</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground text-center">Carregando...</p>}
        {messages.map(msg => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn('flex flex-col max-w-[80%]', isMine ? 'ml-auto items-end' : 'items-start')}>
              {msg.is_internal && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                  <Lock className="w-3 h-3" /> Nota interna
                </span>
              )}
              <div className={cn(
                'rounded-2xl px-4 py-2 text-sm',
                msg.is_internal
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
              )}>
                {!isMine && (
                  <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                    {msg.sender_profile?.full_name || 'Usuário'}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canSend ? (
        <div className="p-3 border-t border-border space-y-2">
          {isAdmin && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={e => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <Lock className="w-3 h-3" />
              Nota interna (apenas admins veem)
            </label>
          )}
          <div className="flex gap-2">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button onClick={handleSend} disabled={!text.trim() || sendMessage.isPending} size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-border text-center text-sm text-muted-foreground">
          Este ticket foi {ticketStatus === 'resolved' ? 'resolvido' : 'fechado'}.
        </div>
      )}
    </div>
  );
}
