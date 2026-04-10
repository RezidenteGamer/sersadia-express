import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  tint?: 'green' | 'amber' | 'neutral';
}

const tintClasses = {
  green: 'bg-success/10',
  amber: 'bg-warning/10',
  neutral: 'bg-accent',
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  tint = 'neutral',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-5", tintClasses[tint])}>
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2 font-serif">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 text-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="rounded-xl">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
