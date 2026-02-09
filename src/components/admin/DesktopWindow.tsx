import { useRef, useState, useCallback, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WindowState } from './useDesktopManager';

interface DesktopWindowProps {
  window: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onFocus: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
}

export function DesktopWindow({
  window: win,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  onUpdatePosition,
}: DesktopWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const Icon = win.icon;
  const ContentComponent = win.component;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y,
    };
    onFocus();
  }, [win.isMaximized, win.position, onFocus]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onUpdatePosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdatePosition]);

  if (win.isMinimized) return null;

  return (
    <div
      className={cn(
        "absolute flex flex-col bg-background border border-border rounded-lg shadow-2xl overflow-hidden transition-shadow",
        win.isMaximized ? "inset-0 rounded-none" : "min-w-[600px] min-h-[400px]",
        isDragging && "cursor-grabbing"
      )}
      style={win.isMaximized ? { zIndex: win.zIndex } : {
        left: win.position.x,
        top: win.position.y,
        width: '70%',
        maxWidth: '1100px',
        height: '75%',
        zIndex: win.zIndex,
      }}
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between h-10 px-3 bg-sidebar text-sidebar-foreground select-none shrink-0"
        onMouseDown={handleMouseDown}
        onDoubleClick={onToggleMaximize}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4" />
          <span>{win.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMaximize(); }}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            {win.isMaximized ? <Square className="w-3 h-3 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 rounded hover:bg-destructive/80 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <ContentComponent />
      </div>
    </div>
  );
}
