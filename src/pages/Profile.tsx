import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMembership } from '@/hooks/useMembers';
import { supabase } from '@/integrations/supabase/client';
import { normalizeMbrfId } from '@/lib/mbrfId';
import { toast } from 'sonner';
import { User, Mail, Phone, IdCard, Tag, Save, Camera, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { data: membership } = useUserMembership(user?.id);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    mbrf_id: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        mbrf_id: (profile as any).mbrf_id || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          mbrf_id: normalizeMbrfId(formData.mbrf_id),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />

      <div className="max-w-2xl space-y-6">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-2">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
              <span className="font-serif text-3xl font-bold text-white">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card shadow-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <h2 className="text-xl font-bold font-serif">{profile?.full_name || 'Usuário'}</h2>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Membership Status */}
        {membership ? (
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-success text-sm">Sócio Ativo</p>
                  <p className="text-xs text-muted-foreground">Você tem direito a preços especiais nas reservas!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-5">
              <div>
                <p className="font-semibold text-sm mb-1">Você ainda não é sócio</p>
                <p className="text-xs text-muted-foreground mb-2">Sócios têm acesso a preços especiais e benefícios exclusivos.</p>
                <button className="text-xs text-warning font-medium hover:underline">
                  Saiba como se tornar sócio →
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" value={profile?.email || ''} disabled className="pl-10 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="full_name" type="text" placeholder="Seu nome completo" className="pl-10" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="(00) 00000-0000" className="pl-10" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mbrf_id" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">ID MBRF (8 dígitos)</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="mbrf_id" type="text" placeholder="00000000" className="pl-10" maxLength={8} value={formData.mbrf_id} onChange={(e) => setFormData({ ...formData, mbrf_id: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
                </div>
                <p className="text-xs text-muted-foreground">Seu ID de funcionário para identificação de sócio.</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="w-auto min-w-[200px]">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
