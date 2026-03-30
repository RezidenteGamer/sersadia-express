import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePixSettings } from '@/hooks/usePixSettings';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  locationName: string;
  onPaymentComplete: () => void;
}

export function PixPaymentDialog({ 
  open, 
  onOpenChange,
  amount,
  locationName,
  onPaymentComplete 
}: PixPaymentDialogProps) {
  const [copied, setCopied] = useState(false);
  const { data: pixSettings } = usePixSettings();

  const handleCopyCode = async () => {
    if (!pixSettings?.pix_key) return;
    
    try {
      await navigator.clipboard.writeText(pixSettings.pix_key);
      setCopied(true);
      toast.success('Chave PIX copiada!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar chave');
    }
  };

  const handleFinish = () => {
    onPaymentComplete();
    onOpenChange(false);
  };

  if (!pixSettings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Pagamento via PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie a chave PIX para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount and Location */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">{locationName}</p>
            <p className="text-2xl font-bold text-primary">
              R$ {amount.toFixed(2)}
            </p>
          </div>

          {/* Beneficiary */}
          {pixSettings.beneficiary_name && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Beneficiário</p>
              <p className="font-medium">{pixSettings.beneficiary_name}</p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            {pixSettings.qr_code_image_url ? (
              <img 
                src={pixSettings.qr_code_image_url}
                alt="QR Code PIX"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                <p className="text-sm text-muted-foreground text-center px-4">
                  QR Code não configurado. Use a chave PIX abaixo.
                </p>
              </div>
            )}
          </div>

          {/* PIX Key display */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Chave PIX (CPF/CNPJ)</p>
            <p className="font-mono font-medium text-sm break-all">{pixSettings.pix_key}</p>
          </div>

          {/* Copy Code Button */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                Chave copiada!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar chave PIX
              </>
            )}
          </Button>

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
