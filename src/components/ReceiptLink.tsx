import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptLinkProps {
  receiptPath: string;
  preview?: boolean;
  className?: string;
}

export function ReceiptLink({ receiptPath, preview = false, className }: ReceiptLinkProps) {
  const { data: url, isError } = useQuery({
    queryKey: ['receipt-signed-url', receiptPath],
    queryFn: async () => {
      // Existing public receipts remain readable until they are migrated.
      if (receiptPath.startsWith('https://')) return receiptPath;
      const { data, error } = await supabase.storage.from('receipts').createSignedUrl(receiptPath, 300);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 4 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  if (isError) return <span className="text-xs text-destructive">Comprovante indisponível</span>;
  if (!url) return <span className="text-xs text-muted-foreground">Carregando comprovante...</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className || 'text-primary hover:underline'}>
      {preview && !receiptPath.toLowerCase().endsWith('.pdf') ? (
        <img src={url} alt="Comprovante de pagamento" className="max-h-60 rounded-lg border object-contain" />
      ) : 'Ver comprovante'}
    </a>
  );
}
