import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Clock, Search, Calendar, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BannerCarousel } from '@/components/BannerCarousel';
import { motion } from 'framer-motion';

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
      <BannerCarousel />

      <PageHeader
        title="Nossos Espaços"
        description="Escolha o espaço perfeito para o seu evento"
      />

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar locais..."
          className="pl-12 h-13 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filteredLocations && filteredLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location, index) => (
            <motion.div
              key={location.id}
              className="rounded-[20px] bg-card shadow-md overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/locations/${location.id}`)}
              whileHover={{ y: -3, boxShadow: '0 8px 24px -4px hsl(30 20% 10% / 0.14)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {/* Image */}
              <div className="relative h-[220px] overflow-hidden">
                {location.images && location.images[0] ? (
                  <img
                    src={location.images[0]}
                    alt={location.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <MapPin className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Title on image */}
                <h3 className="absolute bottom-3 left-4 text-white font-serif text-lg font-bold drop-shadow-md">
                  {location.name}
                </h3>
                {/* Capacity badge */}
                <span className="absolute bottom-3 right-4 bg-white/90 text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm" style={{ color: '#1C1410' }}>
                  👥 {location.capacity} pessoas
                </span>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {location.description || 'Sem descrição disponível'}
                </p>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{location.available_start_time.slice(0, 5)} – {location.available_end_time.slice(0, 5)}</span>
                </div>

                {/* Pricing */}
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">
                    R$ {location.price_fixed ? Number(location.price_fixed).toFixed(2) : Number(location.price_per_hour).toFixed(2)}{location.price_fixed ? ' (fixo)' : '/período'}
                  </p>
                  {(location.price_fixed_member || location.price_per_hour_member) && (
                    <p className="text-sm font-semibold text-success flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Sócio: R$ {location.price_fixed_member ? Number(location.price_fixed_member).toFixed(2) : Number(location.price_per_hour_member).toFixed(2)}{location.price_fixed_member ? '' : '/período'}
                    </p>
                  )}
                </div>

                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Disponibilidade
                </Button>
              </div>
            </motion.div>
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
