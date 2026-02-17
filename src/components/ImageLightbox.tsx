import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_ZOOM = 5;
const MIN_ZOOM = 1;
const SWIPE_THRESHOLD = 50;

export function ImageLightbox({ images, initialIndex = 0, open, onOpenChange }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Touch gesture state
  const touchState = useRef({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    isPinching: false,
    startX: 0,
    startY: 0,
    isSwiping: false,
    moved: false,
  });

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const isZoomed = scale > 1.05;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const toggleZoom = () => {
    if (isZoomed) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch helpers
  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getCenter = (t1: React.Touch, t2: React.Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const ts = touchState.current;
    ts.moved = false;

    if (e.touches.length === 2) {
      e.preventDefault();
      ts.isPinching = true;
      ts.isSwiping = false;
      ts.lastDistance = getDistance(e.touches[0], e.touches[1]);
      ts.lastCenter = getCenter(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      ts.startX = e.touches[0].clientX;
      ts.startY = e.touches[0].clientY;
      ts.isSwiping = !isZoomed;

      if (isZoomed) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      }
    }
  }, [isZoomed, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const ts = touchState.current;

    if (e.touches.length === 2 && ts.isPinching) {
      e.preventDefault();
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const newCenter = getCenter(e.touches[0], e.touches[1]);
      const ratio = newDist / ts.lastDistance;

      setScale(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * ratio)));

      // Pan while pinching
      const dx = newCenter.x - ts.lastCenter.x;
      const dy = newCenter.y - ts.lastCenter.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));

      ts.lastDistance = newDist;
      ts.lastCenter = newCenter;
      ts.moved = true;
    } else if (e.touches.length === 1) {
      ts.moved = true;
      if (isZoomed) {
        // Pan when zoomed
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      }
    }
  }, [isZoomed, dragStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const ts = touchState.current;

    if (ts.isPinching) {
      ts.isPinching = false;
      // Snap to 1 if close
      setScale(prev => {
        if (prev < 1.1) {
          setPosition({ x: 0, y: 0 });
          return 1;
        }
        return prev;
      });
      return;
    }

    setIsDragging(false);

    // Swipe detection (only when not zoomed)
    if (ts.isSwiping && e.changedTouches.length === 1 && !isZoomed) {
      const dx = e.changedTouches[0].clientX - ts.startX;
      const dy = e.changedTouches[0].clientY - ts.startY;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goToPrevious();
        else goToNext();
      }
    }

    // Double-tap zoom
    ts.isSwiping = false;
  }, [isZoomed, goToPrevious, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !isZoomed) goToPrevious();
      if (e.key === 'ArrowRight' && !isZoomed) goToNext();
      if (e.key === 'Escape') {
        if (isZoomed) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          onOpenChange(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isZoomed, goToPrevious, goToNext, onOpenChange]);

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden touch-none">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Zoom button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
            onClick={toggleZoom}
          >
            {isZoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
          </Button>

          {/* Navigation buttons */}
          {images.length > 1 && !isZoomed && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image container with touch gestures */}
          <div
            ref={imageContainerRef}
            className={cn(
              "w-full h-full flex items-center justify-center",
              isZoomed ? "cursor-grab" : "cursor-zoom-in",
              isDragging && "cursor-grabbing"
            )}
            onClick={() => !isDragging && !isZoomed && !touchState.current.moved && toggleZoom()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[currentIndex]}
              alt={`Imagem ${currentIndex + 1}`}
              className={cn(
                "max-w-full max-h-full object-contain select-none",
                !isZoomed && "transition-transform duration-200",
                isZoomed && "max-w-none max-h-none"
              )}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              }}
              draggable={false}
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
              {isZoomed && <span className="ml-2 text-xs opacity-75">(Zoom {Math.round(scale * 100)}%)</span>}
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 1 && !isZoomed && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                    index === currentIndex
                      ? "border-white opacity-100"
                      : "border-transparent opacity-50 hover:opacity-75"
                  )}
                >
                  <img
                    src={image}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
