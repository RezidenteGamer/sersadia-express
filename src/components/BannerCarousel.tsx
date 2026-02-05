import { useState, useEffect, useCallback } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BannerCarousel() {
  const { data: banners, isLoading } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners]);

  const prevSlide = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners, nextSlide]);

  if (isLoading) {
    return (
      <div className="w-full h-48 sm:h-64 lg:h-80 bg-muted animate-pulse rounded-xl" />
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handleClick = () => {
    if (currentBanner.redirect_url) {
      window.open(currentBanner.redirect_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative w-full h-48 sm:h-64 lg:h-80 rounded-xl overflow-hidden mb-6 group">
      {/* Blurred background for aspect ratio fill */}
      <div 
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${currentBanner.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
        }}
      />
      
      {/* Dark overlay on blurred background */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Main image container */}
      <div 
        className={cn(
          "relative w-full h-full flex items-center justify-center",
          currentBanner.redirect_url && "cursor-pointer"
        )}
        onClick={handleClick}
      >
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="max-w-full max-h-full object-contain z-10"
        />
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
