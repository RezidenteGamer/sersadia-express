import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixData: {
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl?: string;
    expirationDate?: string;
    amount: number;
    locationName: string;
  } | null;
  onPaymentComplete: () => void;
}

export function PixPaymentDialog({ 
  open, 
  onOpenChange, 
  pixData,
  onPaymentComplete 
}: PixPaymentDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!pixData?.qrCode) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  const handleFinish = () => {
    onPaymentComplete();
    onOpenChange(false);
  };

  if (!pixData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Pagamento via PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount and Location */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">{pixData.locationName}</p>
            <p className="text-2xl font-bold text-primary">
              R$ {pixData.amount.toFixed(2)}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            {pixData.qrCodeBase64 ? (
              <img 
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                <p className="text-sm text-muted-foreground">QR Code indisponível</p>
              </div>
            )}
          </div>

          {/* Copy Code Button */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                Código copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar código PIX
              </>
            )}
          </Button>

          {/* Ticket URL (for sandbox) */}
          {pixData.ticketUrl && (
            <Button 
              variant="ghost" 
              className="w-full text-sm" 
              asChild
            >
              <a href={pixData.ticketUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir página de pagamento
              </a>
            </Button>
          )}

          {/* Expiration notice */}
          {pixData.expirationDate && (
            <p className="text-xs text-center text-muted-foreground">
              Este código expira em 30 minutos
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Pagar depois
            </Button>
            <Button 
              className="flex-1"
              onClick={handleFinish}
            >
              Já paguei
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
