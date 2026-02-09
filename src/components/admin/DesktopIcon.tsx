import { useState, useRef, useCallback, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopIconProps {
  icon: LucideIcon;
  label: string;
  appId: string;
  gridPosition: { col: number; row: number };
  badge?: number;
  onOpen: () => void;
  onPositionChange: (appId: string, pos: { col: number; row: number }) => void;
  occupiedCells: Map<string, string>;
  onContextMenu: (appId: string, x: number, y: number) => void;
}

const CELL_W = 96;
const CELL_H = 100;
const GAP = 8;

export function DesktopIcon({ icon: Icon, label, appId, gridPosition, badge, onOpen, onPositionChange, occupiedCells, onContextMenu }: DesktopIconProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPos, setTempPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLButtonElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const gridX = gridPosition.col * (CELL_W + GAP) + 24;
  const gridY = gridPosition.row * (CELL_H + GAP) + 24;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return; // skip right click
    e.preventDefault();
    startPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    setDragOffset({ x: e.clientX - gridX, y: e.clientY - gridY });
    setIsDragging(true);
  }, [gridX, gridY]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(appId, e.clientX, e.clientY);
  }, [appId, onContextMenu]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
      setTempPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const handleUp = (e: MouseEvent) => {
      setIsDragging(false);
      if (!hasMoved.current) {
        setTempPos(null);
        onOpen();
        return;
      }
      const rawX = e.clientX - dragOffset.x - 24;
      const rawY = e.clientY - dragOffset.y - 24;
      const col = Math.max(0, Math.round(rawX / (CELL_W + GAP)));
      const row = Math.max(0, Math.round(rawY / (CELL_H + GAP)));
      const key = `${col}-${row}`;
      const occupant = occupiedCells.get(key);
      if (!occupant || occupant === appId) {
        onPositionChange(appId, { col, row });
      }
      setTempPos(null);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragOffset, appId, occupiedCells, onPositionChange, onOpen]);

  const style: React.CSSProperties = isDragging && tempPos
    ? { position: 'absolute', left: tempPos.x, top: tempPos.y, zIndex: 1000, transition: 'none' }
    : { position: 'absolute', left: gridX, top: gridY, transition: 'left 0.2s ease, top 0.2s ease' };

  return (
    <button
      ref={ref}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={onOpen}
      style={style}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-xl select-none",
        "hover:bg-white/10 active:bg-white/20 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        isDragging && "opacity-80 scale-105 cursor-grabbing",
      )}
    >
      <div className="relative">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-150",
          "bg-white/10 backdrop-blur-sm border border-white/15",
          "hover:scale-110 hover:shadow-xl hover:bg-white/15",
        )}>
          <Icon className="w-6 h-6 text-white drop-shadow" />
        </div>
        {/* Notification badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg border-2 border-transparent">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[11px] text-white font-medium text-center leading-tight drop-shadow-md w-20 truncate">
        {label}
      </span>
    </button>
  );
}
