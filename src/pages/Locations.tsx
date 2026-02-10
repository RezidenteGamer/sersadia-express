import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock, Search, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BannerCarousel } from '@/components/BannerCarousel';

export default function Locations() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(search.toLowerCase()) ||
    location.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Banner Carousel */}
      <BannerCarousel />

      <PageHeader 
        title="Locais Disponíveis"
        description="Escolha um espaço para fazer sua reserva"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <Card 
              key={location.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
              onClick={() => navigate(`/locations/${location.id}`)}
            >
              {/* Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {location.images && location.images[0] ? (
                  <img 
                    src={location.images[0]} 
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  <Badge className="bg-card/90 text-foreground">
                    R$ {location.price_fixed ? Number(location.price_fixed).toFixed(2) : Number(location.price_per_hour).toFixed(2)}{location.price_fixed ? '' : '/h'}
                  </Badge>
                  {(location.price_fixed_member || location.price_per_hour_member) && (
                    <span className="text-[10px] text-white drop-shadow-md bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">
                      Sócio: R$ {location.price_fixed_member ? Number(location.price_fixed_member).toFixed(2) : Number(location.price_per_hour_member).toFixed(2)}{location.price_fixed_member ? '' : '/h'}
                    </span>
                  )}
                </div>
              </div>
              
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {location.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {location.description || 'Sem descrição disponível'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{location.capacity} pessoas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {location.available_start_time.slice(0, 5)} - {location.available_end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>

                {/* Pricing below details */}
                <div className="mb-4 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    R$ {location.price_fixed ? Number(location.price_fixed).toFixed(2) : Number(location.price_per_hour).toFixed(2)}{location.price_fixed ? ' (fixo)' : '/período'}
                  </p>
                  {(location.price_fixed_member || location.price_per_hour_member) && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Sócio: R$ {location.price_fixed_member ? Number(location.price_fixed_member).toFixed(2) : Number(location.price_per_hour_member).toFixed(2)}{location.price_fixed_member ? '' : '/período'}
                    </p>
                  )}
                </div>

                <Button className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Disponibilidade
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="Nenhum local encontrado"
          description={search ? 'Tente buscar por outro termo' : 'Nenhum local disponível no momento'}
        />
      )}
    </AppLayout>
  );
}