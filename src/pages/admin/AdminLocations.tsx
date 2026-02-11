import { useState, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ImageUpload';
import { useLocations, useCreateLocation, useUpdateLocation, useToggleLocationStatus, useReorderLocations } from '@/hooks/useLocations';
import { MapPin, Plus, Pencil, Users, Clock, DollarSign, Search, Power, Trash2, GripVertical, ShieldAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Location } from '@/hooks/useLocations';

interface TimeSlot {
  start: string;
  end: string;
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: '08:00', end: '17:00' },
  { start: '18:00', end: '01:30' },
];

export function AdminLocationsContent() {
  const { data: locations, isLoading } = useLocations(true);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const toggleStatus = useToggleLocationStatus();
  const reorderLocations = useReorderLocations();
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 10,
    rules: '',
    time_slots: DEFAULT_TIME_SLOTS,
    price_per_hour: 0,
    price_fixed: null as number | null,
    price_per_hour_member: 0,
    price_fixed_member: null as number | null,
    images: [] as string[],
    imageUrls: '', // For manual URL input
    cancellation_fee_type: 'percentage',
    cancellation_fee_value: 0,
    cancellation_deadline_hours: 24,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 10,
      rules: '',
      time_slots: DEFAULT_TIME_SLOTS,
      price_per_hour: 0,
      price_fixed: null,
      price_per_hour_member: 0,
      price_fixed_member: null,
      images: [],
      imageUrls: '',
      cancellation_fee_type: 'percentage',
      cancellation_fee_value: 0,
      cancellation_deadline_hours: 24,
    });
    setEditingLocation(null);
  };

  const openEditForm = (location: Location) => {
    setEditingLocation(location);
    const timeSlots = (location as any).time_slots as TimeSlot[] || [
      { start: location.available_start_time.substring(0, 5), end: location.available_end_time.substring(0, 5) }
    ];
    setFormData({
      name: location.name,
      description: location.description || '',
      capacity: location.capacity,
      rules: location.rules || '',
      time_slots: timeSlots.length > 0 ? timeSlots : DEFAULT_TIME_SLOTS,
      price_per_hour: location.price_per_hour,
      price_fixed: location.price_fixed,
      price_per_hour_member: (location as any).price_per_hour_member || 0,
      price_fixed_member: (location as any).price_fixed_member || null,
      images: location.images || [],
      imageUrls: '',
      cancellation_fee_type: (location as any).cancellation_fee_type || 'percentage',
      cancellation_fee_value: (location as any).cancellation_fee_value || 0,
      cancellation_deadline_hours: (location as any).cancellation_deadline_hours ?? 24,
    });
    setShowForm(true);
  };

  const handleAddTimeSlot = () => {
    setFormData({
      ...formData,
      time_slots: [...formData.time_slots, { start: '08:00', end: '22:00' }],
    });
  };

  const handleRemoveTimeSlot = (index: number) => {
    if (formData.time_slots.length <= 1) return;
    setFormData({
      ...formData,
      time_slots: formData.time_slots.filter((_, i) => i !== index),
    });
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...formData.time_slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setFormData({ ...formData, time_slots: newSlots });
  };

  const handleSubmit = async () => {
    // Combine uploaded images with manual URLs
    const manualUrls = formData.imageUrls.split('\n').filter(url => url.trim());
    const allImages = [...formData.images, ...manualUrls];

    // Use first time slot for legacy fields
    const firstSlot = formData.time_slots[0] || DEFAULT_TIME_SLOTS[0];

    const data = {
      name: formData.name,
      description: formData.description || null,
      capacity: formData.capacity,
      rules: formData.rules || null,
      available_start_time: firstSlot.start,
      available_end_time: firstSlot.end,
      time_slots: formData.time_slots,
      price_per_hour: formData.price_per_hour,
      price_fixed: formData.price_fixed,
      price_per_hour_member: formData.price_per_hour_member,
      price_fixed_member: formData.price_fixed_member,
      images: allImages.length > 0 ? allImages : null,
      cancellation_fee_type: formData.cancellation_fee_type,
      cancellation_fee_value: formData.cancellation_fee_value,
      cancellation_deadline_hours: formData.cancellation_deadline_hours,
    };

    try {
      if (editingLocation) {
        await updateLocation.mutateAsync({ id: editingLocation.id, data: data as any });
      } else {
        await createLocation.mutateAsync(data as any);
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

  const formatTimeSlots = (location: Location) => {
    const slots = (location as any).time_slots as TimeSlot[] | null;
    if (slots && slots.length > 0) {
      return slots.map(s => `${s.start} - ${s.end}`).join(' | ');
    }
    return `${location.available_start_time.substring(0, 5)} - ${location.available_end_time.substring(0, 5)}`;
  };

  return (
    <>
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
            <Card
              key={location.id}
              className={`hover:shadow-md transition-shadow ${draggedId === location.id ? 'opacity-50' : ''} ${dragOverId === location.id ? 'ring-2 ring-primary' : ''}`}
              draggable={!search}
              onDragStart={() => setDraggedId(location.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(location.id); }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                if (!draggedId || draggedId === location.id || !filteredLocations) return;
                const ids = filteredLocations.map(l => l.id);
                const fromIdx = ids.indexOf(draggedId);
                const toIdx = ids.indexOf(location.id);
                if (fromIdx === -1 || toIdx === -1) return;
                const newIds = [...ids];
                newIds.splice(fromIdx, 1);
                newIds.splice(toIdx, 0, draggedId);
                reorderLocations.mutate(newIds);
                setDraggedId(null);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  {!search && (
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                  )}
                  
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
                        <span className="truncate max-w-[200px]">{formatTimeSlots(location)}</span>
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
                      {((location as any).price_per_hour_member > 0 || (location as any).price_fixed_member) && (
                        <Badge variant="outline" className="text-success border-success">
                          Sócio: {(location as any).price_fixed_member 
                            ? `R$ ${(location as any).price_fixed_member.toFixed(2)}`
                            : `R$ ${((location as any).price_per_hour_member || 0).toFixed(2)}/h`
                          }
                        </Badge>
                      )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Editar Local' : 'Novo Local'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
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

            {/* Time Slots */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Horários de Funcionamento</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTimeSlot}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Horário
                </Button>
              </div>
              
              {formData.time_slots.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Término</Label>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                      />
                    </div>
                  </div>
                  {formData.time_slots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTimeSlot(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pricing - Regular */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preços Regulares</Label>
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
            </div>

            {/* Pricing - Member */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                Preços para Sócios
                <Badge variant="outline" className="text-success border-success">Desconto</Badge>
              </Label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_hour_member">Preço por Hora - Sócio (R$)</Label>
                  <Input
                    id="price_per_hour_member"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price_per_hour_member}
                    onChange={(e) => setFormData({ ...formData, price_per_hour_member: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_fixed_member">Preço Fixo - Sócio (opcional)</Label>
                  <Input
                    id="price_fixed_member"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price_fixed_member || ''}
                    onChange={(e) => setFormData({ ...formData, price_fixed_member: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Deixe vazio para usar preço por hora"
                  />
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Política de Cancelamento
              </Label>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Multa</Label>
                  <Select
                    value={formData.cancellation_fee_type}
                    onValueChange={(v) => setFormData({ ...formData, cancellation_fee_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor da Multa {formData.cancellation_fee_type === 'percentage' ? '(%)' : '(R$)'}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={formData.cancellation_fee_type === 'percentage' ? 1 : 0.01}
                    max={formData.cancellation_fee_type === 'percentage' ? 100 : undefined}
                    value={formData.cancellation_fee_value}
                    onChange={(e) => setFormData({ ...formData, cancellation_fee_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo Limite (horas)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.cancellation_deadline_hours}
                    onChange={(e) => setFormData({ ...formData, cancellation_deadline_hours: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.cancellation_fee_value > 0
                  ? `Cancelamentos feitos com menos de ${formData.cancellation_deadline_hours}h de antecedência terão multa de ${formData.cancellation_fee_type === 'percentage' ? `${formData.cancellation_fee_value}%` : `R$ ${formData.cancellation_fee_value.toFixed(2)}`}.`
                  : 'Sem multa configurada. Cancelamentos terão reembolso total.'}
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Imagens do Local</Label>
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData({ ...formData, images })}
                maxImages={15}
              />
              
              <div className="space-y-2">
                <Label htmlFor="imageUrls" className="text-sm text-muted-foreground">URLs de Imagens Externas (uma por linha)</Label>
                <Textarea
                  id="imageUrls"
                  value={formData.imageUrls}
                  onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })}
                  placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
                  rows={2}
                />
              </div>
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
    </>
  );
}

export default function AdminLocations() {
  return <AppLayout><AdminLocationsContent /></AppLayout>;
}
