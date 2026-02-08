import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Image, ExternalLink, GripVertical } from 'lucide-react';
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, uploadBannerImage, Banner } from '@/hooks/useBanners';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

export function AdminBannersContent() {
  const { data: banners, isLoading } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    redirect_url: '',
    is_active: true,
    display_order: 0,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      redirect_url: '',
      is_active: true,
      display_order: banners?.length || 0,
    });
    setEditingBanner(null);
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        image_url: banner.image_url,
        redirect_url: banner.redirect_url || '',
        is_active: banner.is_active,
        display_order: banner.display_order,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadBannerImage(file);
      setFormData(prev => ({ ...prev, image_url: url }));
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      toast.error('Preencha título e imagem');
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({
          id: editingBanner.id,
          ...formData,
          redirect_url: formData.redirect_url || null,
        });
      } else {
        await createBanner.mutateAsync({
          ...formData,
          redirect_url: formData.redirect_url || null,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;
    await deleteBanner.mutateAsync(id);
  };

  const handleToggleActive = async (banner: Banner) => {
    await updateBanner.mutateAsync({
      id: banner.id,
      is_active: !banner.is_active,
    });
  };

  return (
    <>
      <PageHeader
        title="Gerenciar Banners"
        description="Adicione e gerencie banners promocionais"
      />

      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Promoção de Verão"
                />
              </div>

              <div>
                <Label htmlFor="image">Imagem do Banner</Label>
                <div className="mt-2">
                  {formData.image_url ? (
                    <div className="relative rounded-lg overflow-hidden mb-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-40 object-contain bg-muted"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <LoadingSpinner />
                        ) : (
                          <>
                            <Image className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Clique para enviar imagem
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="redirect_url">URL de Redirecionamento (opcional)</Label>
                <Input
                  id="redirect_url"
                  type="url"
                  value={formData.redirect_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://exemplo.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ao clicar no banner, o usuário será redirecionado para esta URL
                </p>
              </div>

              <div>
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Banner ativo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={createBanner.isPending || updateBanner.isPending}>
                  {editingBanner ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : banners && banners.length > 0 ? (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {banner.title}
                    </h3>
                    {banner.redirect_url && (
                      <a
                        href={banner.redirect_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {banner.redirect_url}
                      </a>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Ordem: {banner.display_order} • {banner.is_active ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={() => handleToggleActive(banner)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Image}
          title="Nenhum banner cadastrado"
          description="Crie banners para exibir promoções e novidades"
        />
      )}
    </>
  );
}

export default function AdminBanners() {
  return <AppLayout><AdminBannersContent /></AppLayout>;
}
