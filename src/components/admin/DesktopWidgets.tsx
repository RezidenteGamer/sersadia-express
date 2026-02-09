import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Monitor, Wifi } from 'lucide-react';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 right-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-white min-w-[220px] pointer-events-auto shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center gap-2 mb-1 text-white/50">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">Relógio</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-light tracking-tight tabular-nums">{hours}</span>
        <span className="text-lg text-white/40 font-light tabular-nums">{seconds}</span>
      </div>
      <p className="text-xs text-white/50 mt-1 capitalize">{dateStr}</p>
    </motion.div>
  );
}

export function StatusWidget({ windowCount, activeApp }: { windowCount: number; activeApp: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="absolute bottom-4 right-[268px] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white min-w-[180px] pointer-events-auto shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center gap-2 mb-3 text-white/50">
        <Monitor className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">Status</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Janelas abertas</span>
          <span className="text-sm font-medium tabular-nums">{windowCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Ativa</span>
          <span className="text-xs font-medium truncate max-w-[90px]">{activeApp || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-[10px] text-green-400/80">Online</span>
        </div>
      </div>
    </motion.div>
  );
}
