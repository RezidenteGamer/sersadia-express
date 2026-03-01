import { useRef, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMembership } from '@/hooks/useMembers';
import { useDependents } from '@/hooks/useDependents';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useOfflineMembershipCard } from '@/hooks/useOfflineMembershipCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Download, Eye, ImagePlus, Share2, WifiOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import brandLogo from '@/assets/ser-sadia-express-logo.png';
import { DependentsList } from '@/components/membership/DependentsList';
import { DependentsCardBack } from '@/components/membership/DependentsCardBack';
import { shareContent } from '@/lib/native';

export default function MembershipCard() {
  const { user, profile, refreshProfile } = useAuth();
  const { data: membership, isLoading: membershipLoading, isError: membershipError } = useUserMembership(user?.id);
  const { data: dependents, isError: dependentsError } = useDependents(membership?.id);
  const { uploadImage, isUploading } = useImageUpload();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  const { cardData, isOffline, cacheAge } = useOfflineMembershipCard({
    membership,
    profile: profile ? { full_name: profile.full_name, email: profile.email, avatar_url: profile.avatar_url, mbrf_id: (profile as any).mbrf_id } : null,
    dependents,
    membershipLoading,
    membershipError: !!membershipError,
    dependentsError: !!dependentsError,
  });

  const displayAvatarUrl = isOffline ? cardData?.avatarUrl : (avatarUrl || profile?.avatar_url);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const url = await uploadImage(file, 'avatars');
    if (url) {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        toast.error('Erro ao salvar foto');
        return;
      }

      setAvatarUrl(url);
      await refreshProfile();
      toast.success('Foto atualizada!');
    }
  };

  const handleDownload = useCallback(async () => {
    if (!cardWrapperRef.current) return;
    try {
      const dataUrl = await toPng(cardWrapperRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `carteirinha-${cardData?.membership?.mbrf_id || 'socio'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Carteirinha salva!');
    } catch {
      toast.error('Erro ao gerar imagem');
    }
  }, [cardData?.membership?.mbrf_id]);

  if (!cardData && !membershipLoading) {
    return (
      <AppLayout>
        <PageHeader title="Carteirinha Digital" description="Sua carteirinha de sócio digital" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">
            {isOffline
              ? 'Você está offline e não há dados salvos. Conecte-se à internet para carregar sua carteirinha.'
              : 'Você não possui um vínculo de sócio ativo.'}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!cardData) return null;

  const memberName = cardData.membership.name || cardData.profile.full_name || 'Sócio';
  const memberId = cardData.membership.mbrf_id || cardData.profile.mbrf_id || '------';
  const today = format(new Date(), 'dd/MM/yyyy');

  return (
    <AppLayout>
      <PageHeader title="Carteirinha Digital" description="Sua carteirinha de sócio digital" />

      <div className="flex flex-col items-center gap-4 py-8">
        {/* Offline banner */}
        {isOffline && cacheAge && (
          <div className="w-[340px] flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-200">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Modo offline — dados de {cacheAge} atrás</span>
          </div>
        )}

        <div ref={cardWrapperRef} className="flex flex-col lg:flex-row items-start justify-center gap-6">
        {/* Card container */}
        <div ref={cardRef} className="w-[340px] bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
          {/* Header with MBRF logo */}
          <div className="bg-white px-6 pt-5 pb-3 flex justify-center">
            <img src={brandLogo} alt="Ser Sadia Express" className="h-20 w-auto object-contain" />
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-4" />

          {/* Photo */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <div
                className="w-28 h-32 bg-muted rounded-md overflow-hidden border-2 border-border flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => !isOffline && setShowPhotoMenu(true)}
              >
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt="Foto do sócio"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Camera className="w-7 h-7" />
                    <span className="text-[10px] font-medium">{isOffline ? 'Sem foto' : 'Toque aqui'}</span>
                  </div>
                )}
              </div>
              {/* Floating hint badge */}
              {!isOffline && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                  {displayAvatarUrl ? 'Toque para opções' : 'Adicionar foto'}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Photo action menu */}
          <Dialog open={showPhotoMenu} onOpenChange={setShowPhotoMenu}>
            <DialogContent className="max-w-[280px] p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-center mb-1">Foto do sócio</p>
                {displayAvatarUrl && (
                  <button
                    className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                    onClick={() => {
                      setShowPhotoMenu(false);
                      setShowPhotoPreview(true);
                    }}
                  >
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    Visualizar foto
                  </button>
                )}
                <button
                  className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  onClick={() => {
                    setShowPhotoMenu(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                  {displayAvatarUrl ? 'Trocar foto' : 'Adicionar foto'}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Photo preview dialog */}
          <Dialog open={showPhotoPreview} onOpenChange={setShowPhotoPreview}>
            <DialogContent className="max-w-sm p-2">
              {displayAvatarUrl && (
                <img src={displayAvatarUrl} alt="Foto do sócio" className="w-full rounded-lg object-contain max-h-[70vh]" />
              )}
            </DialogContent>
          </Dialog>

          {/* Title */}
          <div className="text-center pb-3">
            <p className="text-sm font-bold tracking-wide text-[hsl(0,0%,9%)]">
              SÓCIO - SER SADIA
            </p>
            <p className="text-xs font-semibold text-[hsl(0,0%,40%)]">
              FRANCISCO BELTRÃO - PR
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-4" />

          {/* Info fields */}
          <div className="px-6 py-4 space-y-2">
            <div className="flex gap-2">
              <span className="text-sm font-bold text-[hsl(0,0%,9%)] min-w-[55px]">Nome:</span>
              <span className="text-sm text-[hsl(0,0%,9%)]">{memberName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-bold text-[hsl(0,0%,9%)] min-w-[55px]">ID:</span>
              <span className="text-sm text-[hsl(0,0%,9%)]">{memberId}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="px-6 pb-2">
            <p className="text-sm font-bold text-[hsl(0,0%,9%)]">Ass.:</p>
            <div className="h-8 border-b border-border mt-1" />
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <QRCodeSVG
              value={memberId}
              size={100}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Emission date */}
          <div className="px-6 py-3 text-right">
            <p className="text-xs text-[hsl(0,0%,40%)]">
              Emissão: {today}
            </p>
          </div>
        </div>

        {/* Card Back (dependents) */}
        <div ref={cardBackRef}>
          <DependentsCardBack
            memberId={cardData.membership.id}
            offlineDependents={isOffline ? cardData.dependents : undefined}
          />
        </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Baixar
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => shareContent(
              'Carteirinha Ser Sadia',
              `Carteirinha digital de ${memberName} — ID: ${memberId}`,
              window.location.href
            )}
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>

        {/* Dependents management - hidden when offline */}
        {!isOffline && membership && (
          <DependentsList memberId={membership.id} />
        )}
      </div>
    </AppLayout>
  );
}
