import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PixSettings {
  id: string;
  pix_key: string;
  pix_key_type: string;
  beneficiary_name: string;
  qr_code_image_url: string | null;
  is_active: boolean;
}

export function usePixSettings() {
  return useQuery({
    queryKey: ['pix-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pix_settings' as any)
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as PixSettings;
    },
  });
}

export function useUpdatePixSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Omit<PixSettings, 'id'>>) => {
      // Get existing row id
      const { data: existing } = await supabase
        .from('pix_settings' as any)
        .select('id')
        .limit(1)
        .single();

      if (!existing) throw new Error('No pix settings found');

      const { error } = await supabase
        .from('pix_settings' as any)
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', (existing as any).id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-settings'] });
      toast.success('Configurações PIX salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });
}
