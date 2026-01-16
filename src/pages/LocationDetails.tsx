import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocation, useLocationAvailability } from '@/hooks/useLocations';
import { useCreateReservation } from '@/hooks/useReservations';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Users, Clock, DollarSign, ArrowLeft, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function LocationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { data: location, isLoading } = useLocation(id!);
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: bookedSlots } = useLocationAvailability(id!, dateStr);
  const createReservation = useCreateReservation();

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  if (!location) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Local não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  // Generate time slots based on location availability
  const generateTimeSlots = () => {
    const slots: { start: string; end: string; available: boolean }[] = [];
    const startHour = parseInt(location.available_start_time.split(':')[0]);
    const endHour = parseInt(location.available_end_time.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const start = `${hour.toString().padStart(2, '0')}:00`;
      const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this slot is already booked
      const isBooked = bookedSlots?.some(slot => {
        const slotStart = slot.start_time.substring(0, 5);
        const slotEnd = slot.end_time.substring(0, 5);
        return (start >= slotStart && start < slotEnd) || (end > slotStart && end <= slotEnd);
      });
      
      slots.push({ start, end, available: !isBooked });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const calculatePrice = () => {
    if (!selectedSlot) return 0;
    if (location.price_fixed) return location.price_fixed;
    
    const startHour = parseInt(selectedSlot.start.split(':')[0]);
    const endHour = parseInt(selectedSlot.end.split(':')[0]);
    return (endHour - startHour) * location.price_per_hour;
  };

  const handleReserve = async () => {
    if (!selectedDate || !selectedSlot || !user) return;
    
    try {
      await createReservation.mutateAsync({
        location_id: id!,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        total_price: calculatePrice(),
        user_notes: notes || null,
      });
      setShowConfirmDialog(false);
      navigate('/my-reservations');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <AppLayout>
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate('/locations')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Location Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            {location.images && location.images.length > 0 ? (
              <img 
                src={location.images[0]} 
                alt={location.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <MapPin className="w-16 h-16" />
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{location.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Capacidade: {location.capacity} pessoas</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{location.available_start_time.substring(0, 5)} - {location.available_end_time.substring(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {location.price_fixed 
                      ? `R$ ${location.price_fixed.toFixed(2)} (fixo)`
                      : `R$ ${location.price_per_hour.toFixed(2)}/hora`
                    }
                  </span>
                </div>
              </div>
              
              {location.description && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-muted-foreground">{location.description}</p>
                </div>
              )}
              
              {location.rules && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">Regras do Local</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{location.rules}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Booking Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fazer Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calendar */}
              <div>
                <Label className="mb-2 block">Selecione a Data</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border pointer-events-auto"
                  locale={ptBR}
                />
              </div>
              
              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <Label className="mb-2 block">Horário Disponível</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        disabled={!slot.available}
                        className={cn(
                          "p-2 text-sm rounded-lg border transition-colors",
                          !slot.available && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                          slot.available && selectedSlot?.start === slot.start 
                            ? "bg-primary text-primary-foreground border-primary"
                            : slot.available && "hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {slot.start} - {slot.end}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Price Summary */}
              {selectedSlot && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor Total</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {calculatePrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                size="lg"
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setShowConfirmDialog(true)}
              >
                Solicitar Reserva
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p><strong>Local:</strong> {location.name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {selectedSlot?.start} - {selectedSlot?.end}</p>
              <p><strong>Valor:</strong> R$ {calculatePrice().toFixed(2)}</p>
            </div>
            
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma informação adicional..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReserve} disabled={createReservation.isPending}>
              {createReservation.isPending ? 'Enviando...' : 'Confirmar Reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
