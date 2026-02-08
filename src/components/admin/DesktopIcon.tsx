import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopIconProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function DesktopIcon({ icon: Icon, label, onClick }: DesktopIconProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl w-24",
        "hover:bg-white/10 active:bg-white/20 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shadow-lg border border-white/10">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-[11px] text-white font-medium text-center leading-tight drop-shadow-md">
        {label}
      </span>
    </button>
  );
}
