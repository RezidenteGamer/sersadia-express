import { useRef, useState, useCallback, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WindowState } from './useDesktopManager';

interface DesktopWindowProps {
  window: WindowState;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onFocus: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
  onUpdateSize: (size: { width: number; height: number }) => void;
  onSnap: (snap: WindowState['isSnapped']) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const SNAP_THRESHOLD = 20;

function getSnapStyle(snap: WindowState['isSnapped']): React.CSSProperties {
  switch (snap) {
    case 'left': return { left: 0, top: 0, width: '50%', height: '100%' };
    case 'right': return { left: '50%', top: 0, width: '50%', height: '100%' };
    case 'top-left': return { left: 0, top: 0, width: '50%', height: '50%' };
    case 'top-right': return { left: '50%', top: 0, width: '50%', height: '50%' };
    case 'bottom-left': return { left: 0, top: '50%', width: '50%', height: '50%' };
    case 'bottom-right': return { left: '50%', top: '50%', width: '50%', height: '50%' };
    default: return {};
  }
}

export function DesktopWindow({
  window: win,
  isActive,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  onUpdatePosition,
  onUpdateSize,
  onSnap,
  containerRef,
}: DesktopWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });
  const Icon = win.icon;
  const ContentComponent = win.component;

  // Drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized || win.isSnapped) return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y,
    };
    onFocus();
  }, [win.isMaximized, win.isSnapped, win.position, onFocus]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      onUpdatePosition({ x: newX, y: newY });

      // Snap detection
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const atLeft = relX < SNAP_THRESHOLD;
        const atRight = relX > rect.width - SNAP_THRESHOLD;
        const atTop = relY < SNAP_THRESHOLD;

        if (atLeft && atTop) onSnap('top-left');
        else if (atRight && atTop) onSnap('top-right');
        else if (atLeft && relY > rect.height - SNAP_THRESHOLD) onSnap('bottom-left');
        else if (atRight && relY > rect.height - SNAP_THRESHOLD) onSnap('bottom-right');
        else if (atLeft) onSnap('left');
        else if (atRight) onSnap('right');
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdatePosition, onSnap, containerRef]);

  // Resize handling
  const handleResizeStart = useCallback((dir: string, e: React.MouseEvent) => {
    if (win.isMaximized || win.isSnapped) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);
    resizeStart.current = {
      x: e.clientX, y: e.clientY,
      w: win.size.width, h: win.size.height,
      px: win.position.x, py: win.position.y,
    };
    onFocus();
  }, [win.isMaximized, win.isSnapped, win.size, win.position, onFocus]);

  useEffect(() => {
    if (!isResizing || !resizeDir) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      let { w, h, px, py } = resizeStart.current;

      if (resizeDir.includes('e')) w = Math.max(400, w + dx);
      if (resizeDir.includes('w')) { w = Math.max(400, w - dx); px = resizeStart.current.px + dx; }
      if (resizeDir.includes('s')) h = Math.max(300, h + dy);
      if (resizeDir.includes('n')) { h = Math.max(300, h - dy); py = resizeStart.current.py + dy; }

      onUpdateSize({ width: w, height: h });
      if (resizeDir.includes('w') || resizeDir.includes('n')) {
        onUpdatePosition({ x: px, y: py });
      }
    };
    const handleMouseUp = () => { setIsResizing(false); setResizeDir(null); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDir, onUpdateSize, onUpdatePosition]);

  if (win.isMinimized) return null;

  const isPositioned = win.isMaximized || win.isSnapped;

  const windowStyle: React.CSSProperties = win.isMaximized
    ? { inset: 0, zIndex: win.zIndex }
    : win.isSnapped
      ? { ...getSnapStyle(win.isSnapped), zIndex: win.zIndex }
      : {
          left: win.position.x,
          top: win.position.y,
          width: win.size.width,
          height: win.size.height,
          zIndex: win.zIndex,
        };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={win.isClosing
        ? { opacity: 0, scale: 0.92, transition: { duration: 0.15 } }
        : { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
      }
      className={cn(
        "absolute flex flex-col overflow-hidden transition-[left,top,width,height] duration-200",
        isPositioned ? "rounded-none" : "rounded-xl",
        isDragging && "cursor-grabbing transition-none",
        isResizing && "transition-none",
        isActive
          ? "shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)]"
          : "shadow-[0_10px_30px_-8px_rgba(0,0,0,0.2)]",
      )}
      style={windowStyle}
      onMouseDown={onFocus}
    >
      {/* Glassmorphism background */}
      <div className={cn(
        "absolute inset-0 border",
        isPositioned ? "rounded-none" : "rounded-xl",
        isActive
          ? "bg-background/85 backdrop-blur-xl border-border/60"
          : "bg-background/75 backdrop-blur-lg border-border/40"
      )} />

      {/* Title Bar */}
      <div
        className={cn(
          "relative flex items-center justify-between h-10 px-3 select-none shrink-0 transition-colors",
          isActive ? "bg-sidebar/95" : "bg-sidebar/70"
        )}
        onMouseDown={handleMouseDown}
        onDoubleClick={onToggleMaximize}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Icon className="w-4 h-4" />
          <span>{win.title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="p-1.5 rounded-md hover:bg-white/15 active:bg-white/25 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMaximize(); }}
            className="p-1.5 rounded-md hover:bg-white/15 active:bg-white/25 transition-colors"
          >
            {win.isMaximized ? <Square className="w-3 h-3 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 rounded-md hover:bg-red-500/80 active:bg-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-auto flex flex-col">
        <ContentComponent />
      </div>

      {/* Resize handles (only when not maximized/snapped) */}
      {!isPositioned && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize" onMouseDown={(e) => handleResizeStart('n', e)} />
          <div className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize" onMouseDown={(e) => handleResizeStart('s', e)} />
          <div className="absolute top-0 left-0 bottom-0 w-1.5 cursor-w-resize" onMouseDown={(e) => handleResizeStart('w', e)} />
          <div className="absolute top-0 right-0 bottom-0 w-1.5 cursor-e-resize" onMouseDown={(e) => handleResizeStart('e', e)} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={(e) => handleResizeStart('nw', e)} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={(e) => handleResizeStart('ne', e)} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={(e) => handleResizeStart('sw', e)} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={(e) => handleResizeStart('se', e)} />
        </>
      )}
    </motion.div>
  );
}
