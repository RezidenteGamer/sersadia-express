import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocation, useLocationAvailability } from '@/hooks/useLocations';
import { useCreateReservation } from '@/hooks/useReservations';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMembership } from '@/hooks/useMembers';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Users, Clock, DollarSign, ArrowLeft, Info, Tag, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { ImageLightbox } from '@/components/ImageLightbox';

interface TimeSlot {
  start: string;
  end: string;
}
export default function LocationDetails() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const {
    data: location,
    isLoading
  } = useLocation(id!);
  const {
    data: membership
  } = useUserMembership(user?.id);
  const isMember = !!membership;
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const {
    data: bookedSlots
  } = useLocationAvailability(id!, dateStr);
  const createReservation = useCreateReservation();

  // Sync carousel state
  useEffect(() => {
    if (!carouselApi) return;
    
    setImageCount(carouselApi.scrollSnapList().length);
    setCurrentImageIndex(carouselApi.selectedScrollSnap());
    
    carouselApi.on('select', () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);
  if (isLoading) {
    return <AppLayout>
        <LoadingSpinner />
      </AppLayout>;
  }
  if (!location) {
    return <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Local não encontrado</p>
        </div>
      </AppLayout>;
  }

  // Get fixed time slots from location - use time_slots field or fallback to legacy fields
  const getFixedTimeSlots = (): {
    slot: TimeSlot;
    available: boolean;
  }[] => {
    // Try to get time_slots from location (stored as JSON)
    const locationTimeSlots = (location as any).time_slots as TimeSlot[] | null;

    // Default slots if none defined
    const defaultSlots: TimeSlot[] = [{
      start: '08:00',
      end: '17:00'
    }, {
      start: '18:30',
      end: '01:30'
    }];
    const slots = locationTimeSlots && locationTimeSlots.length > 0 ? locationTimeSlots : defaultSlots;

    // Check availability for each slot
    return slots.map(slot => {
      // Check if this exact slot is already booked
      const isBooked = bookedSlots?.some(booked => {
        const bookedStart = booked.start_time.substring(0, 5);
        const bookedEnd = booked.end_time.substring(0, 5);
        return bookedStart === slot.start && bookedEnd === slot.end;
      });
      return {
        slot,
        available: !isBooked
      };
    });
  };
  const timeSlots = getFixedTimeSlots();
  const calculatePrice = () => {
    if (!selectedSlot) return 0;

    // Use member prices if user is a member and member price is set
    const fixedPrice = isMember && location.price_fixed_member != null ? location.price_fixed_member : location.price_fixed;
    const hourlyPrice = isMember && location.price_per_hour_member != null ? location.price_per_hour_member : location.price_per_hour;

    // If fixed price is set, use it directly
    if (fixedPrice != null && fixedPrice > 0) return fixedPrice;

    // Return hourly price (for the period, not calculated by hours)
    return hourlyPrice;
  };

  const handleReserve = async () => {
    if (!selectedDate || !selectedSlot || !user) return;
    
    setIsProcessingPayment(true);
    
    try {
      // First create the reservation
      const reservation = await createReservation.mutateAsync({
        location_id: id!,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        total_price: calculatePrice(),
        user_notes: notes || null
      });

      // Then create Checkout preference
      const { data, error } = await supabase.functions.invoke('create-pix-checkout', {
        body: {
          reservationId: reservation.id,
          amount: calculatePrice(),
          locationName: location.name,
          reservationDate: format(selectedDate, "dd/MM/yyyy"),
          timeSlot: `${selectedSlot.start} - ${selectedSlot.end}`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Erro ao criar checkout. Você pode pagar depois em "Minhas Reservas".');
        setShowConfirmDialog(false);
        navigate('/my-reservations');
        return;
      }

      // Redirect to Mercado Pago Checkout
      // Use sandbox_init_point for test mode, init_point for production
      const checkoutUrl = data?.initPoint || data?.sandboxInitPoint;
      
      if (checkoutUrl) {
        toast.success('Redirecionando para o pagamento...');
        window.location.href = checkoutUrl;
      } else {
        toast.error('Erro ao gerar link de pagamento. Você pode pagar depois em "Minhas Reservas".');
        setShowConfirmDialog(false);
        navigate('/my-reservations');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error('Erro ao criar reserva.');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  return <AppLayout>
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/locations')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Location Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <div className="relative rounded-xl overflow-hidden bg-muted">
            {location.images && location.images.length > 0 ? (
              <Carousel 
                className="w-full" 
                setApi={setCarouselApi}
                opts={{ loop: true }}
              >
                <CarouselContent>
                  {location.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div 
                        className="aspect-video relative cursor-pointer"
                        onClick={() => setLightboxOpen(true)}
                      >
                        {/* Blurred background for aspect ratio fill */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ 
                            backgroundImage: `url(${image})`,
                            filter: 'blur(20px)',
                            transform: 'scale(1.1)'
                          }}
                        />
                        {/* Main image */}
                        <img 
                          src={image} 
                          alt={`${location.name} - Imagem ${index + 1}`} 
                          className="relative w-full h-full object-contain z-10" 
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {location.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                    {/* Image counter */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {currentImageIndex + 1} / {imageCount}
                    </div>
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-video w-full flex items-center justify-center text-muted-foreground">
                <MapPin className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Image Lightbox */}
          {location.images && location.images.length > 0 && (
            <ImageLightbox
              images={location.images}
              initialIndex={currentImageIndex}
              open={lightboxOpen}
              onOpenChange={setLightboxOpen}
            />
          )}
          
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
                    {location.price_fixed ? `R$ ${location.price_fixed.toFixed(2)} (fixo)` : `R$ ${location.price_per_hour.toFixed(2)}/período`}
                  </span>
                </div>
                {isMember && <Badge variant="outline" className="text-success border-success">
                    <Tag className="w-3 h-3 mr-1" />
                    Preço de Sócio
                  </Badge>}
              </div>
              
              {location.description && <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-muted-foreground">{location.description}</p>
                </div>}
              
              {location.rules && <div className="p-4 rounded-lg bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">Regras do Local</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{location.rules}</p>
                </div>}
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
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={date => date < new Date()} className="rounded-md border pointer-events-auto" locale={ptBR} />
              </div>
              
              {/* Time Slots */}
              {selectedDate && <div>
                  <Label className="mb-2 block">Selecione o Período</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {timeSlots.map(({
                  slot,
                  available
                }) => <button key={`${slot.start}-${slot.end}`} onClick={() => available && setSelectedSlot(slot)} disabled={!available} className={cn("p-3 text-sm rounded-lg border transition-colors text-left", !available && "bg-muted text-muted-foreground cursor-not-allowed opacity-50", available && selectedSlot?.start === slot.start && selectedSlot?.end === slot.end ? "bg-primary text-primary-foreground border-primary" : available && "hover:border-primary hover:bg-primary/5")}>
                        <span className="font-medium">{slot.start} - {slot.end}</span>
                      </button>)}
                  </div>
                </div>}
              
              {/* Price Summary */}
              {selectedSlot && <div className="p-4 rounded-lg space-y-2 bg-background">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor Total</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {calculatePrice().toFixed(2)}
                    </span>
                  </div>
                  {isMember && <div className="text-xs text-success flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Desconto de sócio aplicado
                    </div>}
                </div>}
              
              <Button className="w-full" size="lg" disabled={!selectedDate || !selectedSlot} onClick={() => {
                if (!user) {
                  navigate(`/auth?redirect=/locations/${id}`);
                  return;
                }
                setShowConfirmDialog(true);
              }}>
                {user ? 'Solicitar Reserva' : 'Entrar para Reservar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open);
        if (!open) setAcceptedRules(false);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Revise os detalhes da reserva e aceite as regras do local para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg space-y-2 bg-muted/50">
              <p><strong>Local:</strong> {location.name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR
              })}</p>
              <p><strong>Horário:</strong> {selectedSlot?.start} - {selectedSlot?.end}</p>
              <p><strong>Valor:</strong> R$ {calculatePrice().toFixed(2)}</p>
            </div>
            
            {/* Rules Section */}
            {location.rules && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <Label className="font-medium">Regras do Local</Label>
                </div>
                <ScrollArea className="h-40 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {location.rules}
                  </p>
                </ScrollArea>
                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-background">
                  <Checkbox
                    id="accept-rules"
                    checked={acceptedRules}
                    onCheckedChange={(checked) => setAcceptedRules(checked === true)}
                  />
                  <Label
                    htmlFor="accept-rules"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    Li e concordo com as regras do local. Estou ciente de que o descumprimento das regras pode resultar no cancelamento da reserva.
                  </Label>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma informação adicional..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isProcessingPayment}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReserve} 
              disabled={createReservation.isPending || isProcessingPayment || (location.rules && !acceptedRules)}
            >
              {isProcessingPayment ? 'Redirecionando...' : createReservation.isPending ? 'Enviando...' : 'Pagar Agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>;
}