import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMembership } from '@/hooks/useMembers';
import { useImageUpload } from '@/hooks/useImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function MembershipCard() {
  const { user, profile, refreshProfile } = useAuth();
  const { data: membership } = useUserMembership(user?.id);
  const { uploadImage, isUploading } = useImageUpload();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const displayAvatarUrl = avatarUrl || profile?.avatar_url;

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

  if (!membership) {
    return (
      <AppLayout>
        <PageHeader title="Carteirinha Digital" description="Sua carteirinha de sócio digital" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Você não possui um vínculo de sócio ativo.</p>
        </div>
      </AppLayout>
    );
  }

  const memberName = membership.name || profile?.full_name || 'Sócio';
  const memberId = membership.mbrf_id || (profile as any)?.mbrf_id || '------';
  const today = format(new Date(), 'dd/MM/yyyy');

  return (
    <AppLayout>
      <PageHeader title="Carteirinha Digital" description="Sua carteirinha de sócio digital" />

      <div className="flex justify-center py-8">
        {/* Card container */}
        <div className="w-[340px] bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
          {/* Header with MBRF */}
          <div className="bg-white px-6 pt-6 pb-3 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-[hsl(210,80%,30%)]">
              MBRF
            </h1>
            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="text-xs font-semibold text-[hsl(210,10%,40%)]">
                ☆ Marfrig
              </span>
              <span className="text-xs font-bold text-[hsl(0,70%,50%)]">
                🅱 brf
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-4" />

          {/* Photo */}
          <div className="flex justify-center py-4">
            <div className="relative group">
              <div className="w-28 h-32 bg-muted rounded-md overflow-hidden border-2 border-border flex items-center justify-center">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt="Foto do sócio"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="text-center pb-3">
            <p className="text-sm font-bold tracking-wide text-foreground">
              SÓCIO - SER SADIA
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              FRANCISCO BELTRÃO - PR
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-4" />

          {/* Info fields */}
          <div className="px-6 py-4 space-y-2">
            <div className="flex gap-2">
              <span className="text-sm font-bold text-foreground min-w-[55px]">Nome:</span>
              <span className="text-sm text-foreground">{memberName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-bold text-foreground min-w-[55px]">ID:</span>
              <span className="text-sm text-foreground">{memberId}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="px-6 pb-2">
            <p className="text-sm font-bold text-foreground">Ass.:</p>
            <div className="h-8 border-b border-border mt-1" />
          </div>

          {/* Emission date */}
          <div className="px-6 py-3 text-right">
            <p className="text-xs text-muted-foreground">
              Emissão: {today}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
