import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Clock, Search, ArrowRight, Tag, AlertCircle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BannerCarousel } from '@/components/BannerCarousel';
import { motion } from 'framer-motion';
import { useLocations } from '@/hooks/useLocations';
import { formatCurrency, getLocationPeriods, getMemberPeriodPrice, getPeriodPrice } from '@/lib/locationPresentation';

export default function Locations() {
  const [search, setSearch] = useState('');
  const { data: locations, isLoading, isError, refetch } = useLocations();

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(search.toLowerCase()) ||
    location.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <BannerCarousel />

      <PageHeader
        title="Nossos Espaços"
        description="Compare espaços, valores e períodos antes de reservar"
      />

      {/* Search */}
      <div className="relative mb-8">
        <label htmlFor="location-search" className="sr-only">Buscar espaços</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <Input
          id="location-search"
          placeholder="Buscar por nome ou descrição"
          className="pl-12 pr-12 h-12 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar os espaços"
          description="Confira sua conexão e tente novamente. Seus dados de busca foram mantidos."
          action={{ label: 'Tentar novamente', onClick: () => { void refetch(); } }}
        />
      ) : filteredLocations && filteredLocations.length > 0 ? (
        <div>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {filteredLocations.length} {filteredLocations.length === 1 ? 'espaço encontrado' : 'espaços encontrados'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLocations.map((location, index) => (
            <motion.article
              key={location.id}
              className="rounded-2xl bg-card border border-border/70 shadow-sm overflow-hidden group"
              whileHover={{ y: -3, boxShadow: '0 8px 24px -4px hsl(30 20% 10% / 0.14)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link to={`/locations/${location.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {location.images && location.images[0] ? (
                  <img
                    src={location.images[0]}
                    alt={location.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gradient-to-br from-accent to-muted">
                    <MapPin className="w-10 h-10 text-muted-foreground/60" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">Foto em breve</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-4 min-h-[240px]">
                <div>
                  <h2 className="text-xl font-semibold text-foreground font-serif">{location.name}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {location.description || 'Sem descrição disponível'}
                </p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Até {location.capacity} pessoas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{getLocationPeriods(location).map(slot => `${slot.start}–${slot.end}`).join(' · ')}</span>
                  </div>
                </div>

                <div className="mt-auto border-t border-border pt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">A partir de</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(getPeriodPrice(location))} <span className="text-xs font-normal text-muted-foreground">por período</span></p>
                    {getMemberPeriodPrice(location) != null && (
                    <p className="text-xs font-semibold text-success flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                      Sócio: {formatCurrency(getMemberPeriodPrice(location)!)} por período
                    </p>
                  )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary whitespace-nowrap">
                    Ver horários <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
              </Link>
            </motion.article>
          ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title={search ? 'Nenhum espaço corresponde à busca' : 'Ainda não há espaços disponíveis'}
          description={search ? 'Tente outro nome ou limpe a busca.' : 'Volte mais tarde para conferir novas opções.'}
          action={search ? { label: 'Limpar busca', onClick: () => setSearch('') } : undefined}
        />
      )}
    </AppLayout>
  );
}
