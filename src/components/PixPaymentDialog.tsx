import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Clock, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePixSettings } from '@/hooks/usePixSettings';
import { useReceiptUpload } from '@/hooks/useReceiptUpload';
import { formatCurrency } from '@/lib/locationPresentation';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  locationName: string;
  reservationId: string;
  onPaymentComplete: (receiptPath: string) => Promise<void>;
}

export function PixPaymentDialog({ 
  open, 
  onOpenChange,
  amount,
  locationName,
  reservationId,
  onPaymentComplete
}: PixPaymentDialogProps) {
  const [copied, setCopied] = useState(false);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { data: pixSettings, isLoading: pixLoading, refetch: refetchPixSettings } = usePixSettings();
  const { uploadReceipt, removeUnusedReceipt, isUploading } = useReceiptUpload();

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

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadReceipt(reservationId, file);
      if (receiptPath) await removeUnusedReceipt(receiptPath);
      setReceiptPath(path);
      toast.success('Comprovante anexado. Confirme o envio para análise.');
    } catch (error) {
      toast.error('Erro ao enviar comprovante: ' + (error as Error).message);
    }
  };

  const handleFinish = async () => {
    if (!receiptPath) {
      toast.error('Anexe o comprovante do PIX antes de enviar para análise.');
      return;
    }
    setIsSaving(true);
    try {
      await onPaymentComplete(receiptPath);
      setReceiptPath(null);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar comprovante: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (pixLoading || !pixSettings?.pix_key || !pixSettings.is_active) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reserva criada</DialogTitle>
            <DialogDescription>
              {pixLoading
                ? 'Carregando os dados para pagamento via PIX...'
                : 'Os dados de pagamento não estão disponíveis agora. Sua reserva permanece registrada; acompanhe-a em Minhas Reservas.'}
            </DialogDescription>
          </DialogHeader>
          {!pixLoading && <Button variant="outline" onClick={() => { void refetchPixSettings(); }}>Tentar novamente</Button>}
          <Button onClick={() => onOpenChange(false)}>Voltar às minhas reservas</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Reserva criada · pagamento pendente
          </DialogTitle>
          <DialogDescription>
            Pague via PIX e envie o comprovante. A equipe confirmará o pagamento e a reserva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount and Location */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">{locationName}</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(amount)}
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
          <div className="flex justify-center p-4 bg-background border rounded-lg">
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
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                Chave copiada!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar chave PIX
              </>
            )}
          </Button>

          {/* Receipt Upload */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium text-center">Envie o comprovante do PIX</p>
            {receiptPath && <p className="text-xs text-success text-center">Comprovante anexado. Confirme o envio abaixo ou selecione outro arquivo.</p>}
              <div>
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Enviando...' : 'Toque para enviar o comprovante'}
                    </p>
                  </div>
                </label>
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleUploadReceipt}
                  disabled={isUploading}
                />
              </div>
          </div>

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
              disabled={!receiptPath || isUploading || isSaving}
            >
              {isSaving ? 'Enviando...' : 'Enviar comprovante'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
