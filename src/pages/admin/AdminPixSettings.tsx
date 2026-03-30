import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePixSettings, useUpdatePixSettings } from '@/hooks/usePixSettings';
import { useImageUpload } from '@/hooks/useImageUpload';
import { QrCode, Save, Upload, Trash2 } from 'lucide-react';

export default function AdminPixSettings() {
  const { data: settings, isLoading } = usePixSettings();
  const updateSettings = useUpdatePixSettings();
  const { uploadImage, isUploading } = useImageUpload();

  const [pixKey, setPixKey] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (settings) {
      setPixKey(settings.pix_key);
      setBeneficiaryName(settings.beneficiary_name);
      setQrCodeUrl(settings.qr_code_image_url);
      setIsActive(settings.is_active);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      pix_key: pixKey,
      pix_key_type: 'cpf',
      beneficiary_name: beneficiaryName,
      qr_code_image_url: qrCodeUrl,
      is_active: isActive,
    });
  };

  const handleUploadQrCode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'banner-images');
    if (url) setQrCodeUrl(url);
  };

  if (isLoading) {
    return <AppLayout><LoadingSpinner /></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader title="Configurações PIX" />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Chave PIX
          </CardTitle>
          <CardDescription>
            Configure a chave PIX que será exibida aos clientes no checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="pix-active">Pagamento PIX ativo</Label>
            <Switch
              id="pix-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiary">Nome do Beneficiário</Label>
            <Input
              id="beneficiary"
              value={beneficiaryName}
              onChange={e => setBeneficiaryName(e.target.value)}
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX (CPF/CNPJ)</Label>
            <Input
              id="pix-key"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder="Ex: 000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label>QR Code (imagem)</Label>
            {qrCodeUrl ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-4 bg-white flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrCodeUrl(null)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover imagem
                </Button>
              </div>
            ) : (
              <div>
                <label htmlFor="qr-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Enviando...' : 'Clique para fazer upload do QR Code'}
                    </p>
                  </div>
                </label>
                <input
                  id="qr-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadQrCode}
                  disabled={isUploading}
                />
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={updateSettings.isPending || !pixKey || !beneficiaryName}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
