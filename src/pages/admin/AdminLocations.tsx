import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLocations, useCreateLocation, useUpdateLocation, useToggleLocationStatus } from '@/hooks/useLocations';
import { MapPin, Plus, Pencil, Users, Clock, DollarSign, Search, Power } from 'lucide-react';
import type { Location } from '@/hooks/useLocations';

export default function AdminLocations() {
  const { data: locations, isLoading } = useLocations(true);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const toggleStatus = useToggleLocationStatus();
  
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 10,
    rules: '',
    available_start_time: '08:00',
    available_end_time: '22:00',
    price_per_hour: 0,
    price_fixed: null as number | null,
    images: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 10,
      rules: '',
      available_start_time: '08:00',
      available_end_time: '22:00',
      price_per_hour: 0,
      price_fixed: null,
      images: [],
    });
    setEditingLocation(null);
  };

  const openEditForm = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      capacity: location.capacity,
      rules: location.rules || '',
      available_start_time: location.available_start_time.substring(0, 5),
      available_end_time: location.available_end_time.substring(0, 5),
      price_per_hour: location.price_per_hour,
      price_fixed: location.price_fixed,
      images: location.images || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const data = {
      name: formData.name,
      description: formData.description || null,
      capacity: formData.capacity,
      rules: formData.rules || null,
      available_start_time: formData.available_start_time,
      available_end_time: formData.available_end_time,
      price_per_hour: formData.price_per_hour,
      price_fixed: formData.price_fixed,
      images: formData.images.length > 0 ? formData.images : null,
    };

    try {
      if (editingLocation) {
        await updateLocation.mutateAsync({ id: editingLocation.id, data });
      } else {
        await createLocation.mutateAsync(data);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader 
        title="Gerenciar Locais"
        description="Adicione, edite e gerencie os espaços disponíveis"
        action={
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Local
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar locais..."
          className="pl-10 h-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredLocations && filteredLocations.length > 0 ? (
        <div className="grid gap-4">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {location.images && location.images[0] ? (
                      <img 
                        src={location.images[0]} 
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{location.name}</h3>
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {location.description || 'Sem descrição'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{location.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{location.available_start_time.substring(0, 5)} - {location.available_end_time.substring(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {location.price_fixed 
                            ? `R$ ${location.price_fixed.toFixed(2)} fixo`
                            : `R$ ${location.price_per_hour.toFixed(2)}/h`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleStatus.mutate({ id: location.id, isActive: !location.is_active })}
                      title={location.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <Power className={`w-4 h-4 ${location.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditForm(location)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="Nenhum local cadastrado"
          description="Adicione seu primeiro local para começar"
          action={{
            label: 'Adicionar Local',
            onClick: () => { resetForm(); setShowForm(true); },
          }}
        />
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } else setShowForm(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Editar Local' : 'Novo Local'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o local..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rules">Regras do Local</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Regras de uso do espaço..."
                rows={3}
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário de Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.available_start_time}
                  onChange={(e) => setFormData({ ...formData, available_start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Horário de Término</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.available_end_time}
                  onChange={(e) => setFormData({ ...formData, available_end_time: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_per_hour">Preço por Hora (R$)</Label>
                <Input
                  id="price_per_hour"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price_per_hour}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_fixed">Preço Fixo (opcional)</Label>
                <Input
                  id="price_fixed"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price_fixed || ''}
                  onChange={(e) => setFormData({ ...formData, price_fixed: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Deixe vazio para usar preço por hora"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="images">URLs das Imagens (uma por linha)</Label>
              <Textarea
                id="images"
                value={formData.images.join('\n')}
                onChange={(e) => setFormData({ ...formData, images: e.target.value.split('\n').filter(Boolean) })}
                placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || createLocation.isPending || updateLocation.isPending}
            >
              {createLocation.isPending || updateLocation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
