import { useState, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReservationCenter } from './useReservationCenter';
import { ReservationToolbar } from './ReservationToolbar';
import { ReservationList } from './ReservationList';
import { ReservationDetail } from './ReservationDetail';
import { ReservationContextMenu } from './ReservationContextMenu';
import { copyToClipboard } from '@/lib/native';
import type { ReservationWithDetails } from './types';

export function ReservationCommandCenterContent() {
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    quickFilter, setQuickFilter,
    locationFilter, setLocationFilter,
    dateFilter, setDateFilter,
    selectedId, setSelectedId,
    filtered,
    stats,
    selectedReservation,
    locations,
    isLoading,
  } = useReservationCenter();

  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; reservation: ReservationWithDetails | null }>({
    open: false, x: 0, y: 0, reservation: null,
  });

  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const isMobile = useIsMobile();
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 800;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    if (isNarrow || isMobile) setMobileShowDetail(true);
  }, [setSelectedId, isNarrow, isMobile]);

  const handleContextMenu = useCallback((reservation: ReservationWithDetails, x: number, y: number) => {
    setContextMenu({ open: true, x, y, reservation });
  }, []);

  const handleContextAction = useCallback((action: string) => {
    const r = contextMenu.reservation;
    if (!r) return;
    // Select the reservation to show detail, and the detail panel handles actions
    setSelectedId(r.id);
    if (isNarrow || isMobile) setMobileShowDetail(true);
    // For copy, just copy immediately
    if (action === 'view') return;
  }, [contextMenu.reservation, setSelectedId, isNarrow, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        if (selectedReservation) {
          copyToClipboard(selectedReservation.code, 'Código');
        }
        return;
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        setMobileShowDetail(false);
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = filtered.findIndex(r => r.id === selectedId);
        const next = e.key === 'ArrowDown'
          ? Math.min(idx + 1, filtered.length - 1)
          : Math.max(idx - 1, 0);
        if (filtered[next]) setSelectedId(filtered[next].id);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedReservation, filtered, setSelectedId]);

  // Narrow/mobile: show either list or detail
  const showSinglePanel = isNarrow || isMobile;

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Toolbar */}
      <ReservationToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        locations={locations}
        stats={stats}
        filtered={filtered}
      />

      {/* Main content: list + detail */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        {(!showSinglePanel || !mobileShowDetail) && (
          <div className={cn(
            'border-r border-border/30 flex flex-col',
            showSinglePanel ? 'w-full' : 'w-[420px] shrink-0'
          )}>
            <ReservationList
              reservations={filtered}
              selectedId={selectedId}
              onSelect={handleSelect}
              isLoading={isLoading}
              onContextMenu={handleContextMenu}
            />
          </div>
        )}

        {/* Right Panel */}
        {(!showSinglePanel || mobileShowDetail) && (
          <div className="flex-1 min-w-0">
            {showSinglePanel && mobileShowDetail && (
              <button
                onClick={() => setMobileShowDetail(false)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-primary hover:underline"
              >
                ← Voltar à lista
              </button>
            )}
            {selectedReservation ? (
              <ReservationDetail
                key={selectedReservation.id}
                reservation={selectedReservation}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <Calendar className="w-16 h-16 opacity-20" />
                <p className="text-sm">Selecione uma reserva para ver os detalhes</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ReservationContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        reservation={contextMenu.reservation}
        onClose={() => setContextMenu(prev => ({ ...prev, open: false }))}
        onAction={handleContextAction}
      />
    </div>
  );
}
