import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocation, useLocationAvailability } from '@/hooks/useLocations';
import { useCreateReservation } from '@/hooks/useReservations';
import { useUploadReceipt } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMembership } from '@/hooks/useMembers';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Users, Clock, DollarSign, ArrowLeft, Info, Tag, AlertTriangle } from 'lucide-react';
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
import type { Json } from '@/integrations/supabase/types';
import { PixPaymentDialog } from '@/components/PixPaymentDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, getLocationPeriods, getMemberPeriodPrice, getPeriodPrice, type LocationPeriod } from '@/lib/locationPresentation';

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
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdReservationId, setCreatedReservationId] = useState<string | null>(null);
  const [createdAmount, setCreatedAmount] = useState(0);
  const {
    data: location,
    isLoading,
    isError: locationError,
    refetch: refetchLocation,
  } = useLocation(id!);
  const {
    data: membership
  } = useUserMembership(user?.id);
  const isMember = !!membership;
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const {
    data: bookedSlots,
    isLoading: availabilityLoading,
    isError: availabilityError,
    refetch: refetchAvailability,
  } = useLocationAvailability(id!, dateStr);
  const createReservation = useCreateReservation();
  const uploadReceipt = useUploadReceipt();

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
  if (locationError) {
    return <AppLayout>
      <EmptyState icon={AlertTriangle} title="Não foi possível carregar este espaço" description="Confira sua conexão e tente novamente." action={{ label: 'Tentar novamente', onClick: () => { void refetchLocation(); } }} />
    </AppLayout>;
  }
  if (!location) {
    return <AppLayout>
        <EmptyState icon={MapPin} title="Espaço não encontrado" description="Confira o endereço ou escolha outro espaço no catálogo." action={{ label: 'Ver espaços', onClick: () => navigate('/locations') }} />
      </AppLayout>;
  }

  // Get fixed time slots from location - use time_slots field or fallback to legacy fields
  const getFixedTimeSlots = (): {
    slot: LocationPeriod;
    available: boolean;
  }[] => {
    const slots = getLocationPeriods(location);

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
  const slotKey = (slot: LocationPeriod) => `${slot.start}-${slot.end}`;
  const selectedSlots = timeSlots
    .filter(({ slot, available }) => available && selectedSlotKeys.includes(slotKey(slot)))
    .map(({ slot }) => slot);
  const allAvailable = timeSlots.length > 1 && timeSlots.every(({ available }) => available);
  const allSelected = allAvailable && selectedSlots.length === timeSlots.length;

  const toggleSlot = (slot: LocationPeriod) => {
    const key = slotKey(slot);
    setSelectedSlotKeys(current => current.includes(key)
      ? current.filter(value => value !== key)
      : [...current, key]);
  };
  const calculatePrice = () => {
    if (selectedSlots.length === 0) return 0;

    return getPeriodPrice(location, isMember) * selectedSlots.length;
  };

  const handleReserve = async () => {
    if (!selectedDate || selectedSlots.length === 0 || !user || availabilityLoading || availabilityError) return;
    
    setIsProcessingPayment(true);
    
    try {
      const amount = calculatePrice();
      const reservation = await createReservation.mutateAsync({
        location_id: id!,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlots[0].start,
        end_time: selectedSlots[selectedSlots.length - 1].end,
        time_slots: selectedSlots as unknown as Json,
        total_price: amount,
        user_notes: notes || null
      });

      setCreatedReservationId(reservation.id);
      setCreatedAmount(reservation.total_price);
      setShowConfirmDialog(false);
      setShowPixDialog(true);
    } catch (error) {
      console.error('Reservation error:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };
  return <AppLayout>
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/locations')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold font-serif">{location.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Confira os períodos e o valor antes de criar a reserva.</p>
      </div>

      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Location Info */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Image Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-muted">
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
                          loading="lazy"
                          decoding="async"
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
                    <div className="absolute bottom-3 right-3 z-20 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-foreground shadow-sm">
                      {currentImageIndex + 1} / {imageCount}
                    </div>
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-12 h-12" />
                <span className="text-sm">Foto em breve</span>
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
              <CardTitle className="text-2xl font-serif">Sobre o espaço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {location.capacity} pessoas
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{getLocationPeriods(location).map(period => `${period.start}–${period.end}`).join(' · ')}</span>
                </span>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <DollarSign className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span>
                      {formatCurrency(getPeriodPrice(location, isMember))} por período
                    </span>
                    {!isMember && getMemberPeriodPrice(location) !== null && (
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Sócio: {formatCurrency(getMemberPeriodPrice(location)!)} por período
                      </span>
                    )}
                  </div>
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
              
              {location.rules && <div className="p-4 rounded-xl bg-accent">
                  <div className="flex items-center gap-2 mb-3">
                    <span>📋</span>
                    <h4 className="font-semibold font-serif">Regras do Local</h4>
                  </div>
                  <ol className="space-y-2">
                    {location.rules.split('\n').filter(Boolean).map((rule, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-primary font-bold min-w-[20px]">{i + 1}.</span>
                        <span>{rule.replace(/^\d+[.)]\s*/, '')}</span>
                      </li>
                    ))}
                  </ol>
                </div>}
            </CardContent>
          </Card>
        </div>
        
        {/* Booking Panel */}
        <div className="space-y-4 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Fazer Reserva</CardTitle>
              <p className="text-sm text-muted-foreground">Escolha a data e os períodos. Depois, revise a reserva e pague via PIX.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calendar */}
              <div>
                <Label className="mb-2 block">Selecione a Data</Label>
                <Calendar mode="single" selected={selectedDate} onSelect={date => { setSelectedDate(date); setSelectedSlotKeys([]); }} disabled={date => date < new Date()} className="rounded-xl border pointer-events-auto" locale={ptBR} />
              </div>
              
              {/* Time Slots */}
              {selectedDate && <div>
                  <Label className="mb-2 block">Selecione um ou mais períodos</Label>
                  {availabilityError && <div className="mb-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <p>Não foi possível consultar a disponibilidade.</p>
                    <button type="button" className="font-semibold underline mt-1" onClick={() => { void refetchAvailability(); }}>Tentar novamente</button>
                  </div>}
                  <div className="grid grid-cols-1 gap-2">
                    {timeSlots.map(({
                  slot,
                  available
                }, index) => <button type="button" key={slotKey(slot)} onClick={() => toggleSlot(slot)} disabled={!available || availabilityLoading || availabilityError} aria-pressed={selectedSlotKeys.includes(slotKey(slot))} className={cn("p-4 text-sm rounded-xl border-2 transition-all text-left font-medium flex items-center justify-between gap-3", !available && "bg-muted text-muted-foreground cursor-not-allowed opacity-50", available && selectedSlotKeys.includes(slotKey(slot)) ? "bg-primary text-primary-foreground border-primary shadow-sm" : available && "bg-accent border-transparent hover:border-primary")}>
                        <span><span className="block text-xs opacity-80">Período {index + 1}</span><span className="font-semibold">{slot.start}–{slot.end}</span></span>
                        <span className="text-xs">{availabilityLoading ? 'Consultando' : available ? 'Disponível' : 'Indisponível'}</span>
                      </button>)}
                  </div>
                  {allAvailable && <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setSelectedSlotKeys(allSelected ? [] : timeSlots.map(({ slot }) => slotKey(slot)))}>
                    {allSelected ? 'Desmarcar todos os períodos' : 'Selecionar todos os períodos (1 reserva)'}
                  </Button>}
                </div>}
              
              {/* Price Summary */}
              {selectedSlots.length > 0 && <div className="p-4 rounded-xl space-y-2 bg-accent" aria-live="polite">
                  <p className="text-sm font-semibold">Resumo da reserva</p>
                  <p className="text-sm text-muted-foreground">{selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} · {selectedSlots.map(slot => `${slot.start}–${slot.end}`).join(' e ')}</p>
                  <p className="text-xs text-muted-foreground">{selectedSlots.length} {selectedSlots.length === 1 ? 'período' : 'períodos'} · uma reserva · um pagamento</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Valor Total</span>
                    <span className="text-2xl font-bold text-primary font-serif">
                      {formatCurrency(calculatePrice())}
                    </span>
                  </div>
                  {isMember && <div className="text-xs text-success flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Valor para sócio aplicado
                    </div>}
                </div>}
              
              <Button className="w-full" size="lg" disabled={!selectedDate || selectedSlots.length === 0 || availabilityLoading || availabilityError} onClick={() => {
                if (!user) {
                  navigate(`/auth?redirect=/locations/${id}`);
                  return;
                }
                setShowConfirmDialog(true);
              }}>
                {user ? 'Revisar reserva' : 'Entrar para reservar'}
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
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Revisar e criar reserva</DialogTitle>
            <DialogDescription>
              Ao continuar, a reserva será criada com pagamento pendente. Depois, você verá as instruções para pagar via PIX.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-2 bg-accent">
              <p><strong>Local:</strong> {location.name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR
              })}</p>
              <p><strong>Horários:</strong> {selectedSlots.map(slot => `${slot.start} - ${slot.end}`).join(' e ')}</p>
              <p><strong>Valor:</strong> {formatCurrency(calculatePrice())}</p>
            </div>
            
            {/* Rules Section */}
            {location.rules && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-warning">
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
              {isProcessingPayment ? 'Criando...' : createReservation.isPending ? 'Enviando...' : 'Criar reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Dialog */}
      <PixPaymentDialog
        open={showPixDialog}
        onOpenChange={(open) => {
          setShowPixDialog(open);
          if (!open && createdReservationId) navigate('/my-reservations');
        }}
        amount={createdAmount}
        locationName={location.name}
        reservationId={createdReservationId || ''}
        onPaymentComplete={async (receiptUrl) => {
          if (createdReservationId) {
            await uploadReceipt.mutateAsync({ reservationId: createdReservationId, receiptUrl });
          }
          toast.success('Comprovante enviado. O pagamento será analisado pela equipe.');
          navigate('/my-reservations');
        }}
      />
    </AppLayout>;
}
