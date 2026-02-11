import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface SupportTicket {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string;
  status: 'waiting' | 'in_progress' | 'resolved' | 'closed';
  rating: number | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; email: string } | null;
  admin_profile?: { full_name: string } | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  is_read: boolean;
  created_at: string;
  sender_profile?: { full_name: string } | null;
}

// User: fetch own tickets
export function useUserTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['support-tickets', 'user', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });
}

// Admin: fetch all tickets
export function useAdminTickets() {
  return useQuery({
    queryKey: ['support-tickets', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      // Fetch user profiles for each ticket
      const userIds = [...new Set(data.map((t: any) => t.user_id))];
      const adminIds = [...new Set(data.filter((t: any) => t.admin_id).map((t: any) => t.admin_id))];
      const allIds = [...new Set([...userIds, ...adminIds])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map((t: any) => ({
        ...t,
        profiles: profileMap.get(t.user_id) || null,
        admin_profile: t.admin_id ? profileMap.get(t.admin_id) || null : null,
      })) as SupportTicket[];
    },
  });
}

// Fetch messages for a ticket
export function useTicketMessages(ticketId: string | null) {
  return useQuery({
    queryKey: ['support-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map((m: any) => ({
        ...m,
        sender_profile: profileMap.get(m.sender_id) || null,
      })) as SupportMessage[];
    },
    enabled: !!ticketId,
  });
}

// Create ticket
export function useCreateTicket() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({ user_id: user!.id, subject })
        .select()
        .single();
      if (error) throw error;

      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticket.id, sender_id: user!.id, message });
      if (msgError) throw msgError;

      return ticket;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

// Send message
export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ ticketId, message, isInternal = false }: { ticketId: string; message: string; isInternal?: boolean }) => {
      const { error } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_id: user!.id, message, is_internal: isInternal });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['support-messages', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

// Admin: accept ticket
export function useAcceptTicket() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ admin_id: user!.id, status: 'in_progress' as any })
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

// Admin: resolve ticket
export function useResolveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved' as any })
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

// User: rate ticket
export function useRateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, rating }: { ticketId: string; rating: number }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ rating, status: 'closed' as any })
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

// Mark messages as read
export function useMarkMessagesRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .neq('sender_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_, ticketId) => {
      qc.invalidateQueries({ queryKey: ['support-messages', ticketId] });
    },
  });
}

// Waiting tickets count (for admin badge)
export function useWaitingTicketsCount() {
  return useQuery({
    queryKey: ['support-tickets', 'waiting-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting' as any);
      if (error) throw error;
      return count || 0;
    },
  });
}

// Realtime subscription for tickets and messages
export function useSupportRealtime(ticketId?: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('support-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        qc.invalidateQueries({ queryKey: ['support-tickets'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        if (ticketId) {
          qc.invalidateQueries({ queryKey: ['support-messages', ticketId] });
        }
        qc.invalidateQueries({ queryKey: ['support-tickets'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc, ticketId]);
}
