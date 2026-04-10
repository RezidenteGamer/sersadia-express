import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

const variantClasses = {
  default: 'bg-card',
  primary: 'bg-card',
  success: 'bg-card',
  warning: 'bg-card',
  destructive: 'bg-card',
};

const iconVariantClasses = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  
  useEffect(() => {
    const duration = 600;
    const start = ref.current;
    const diff = value - start;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{display}</>;
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
  
  return (
    <div className={cn(
      "rounded-2xl shadow-md p-5 transition-all hover:shadow-lg",
      variantClasses[variant]
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground font-serif">
            {typeof value === 'number' ? <AnimatedNumber value={numericValue} /> : value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm mt-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs mês anterior
            </p>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center",
          iconVariantClasses[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
