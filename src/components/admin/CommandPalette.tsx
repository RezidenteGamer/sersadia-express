import { useEffect, useState, useMemo } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import type { DesktopApp } from './useDesktopManager';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: DesktopApp[];
  onSelectApp: (app: DesktopApp) => void;
}

export function CommandPalette({ open, onOpenChange, apps, onSelectApp }: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar aplicativo..." />
      <CommandList>
        <CommandEmpty>Nenhum aplicativo encontrado.</CommandEmpty>
        <CommandGroup heading="Aplicativos">
          {apps.map(app => {
            const Icon = app.icon;
            return (
              <CommandItem
                key={app.id}
                onSelect={() => {
                  onSelectApp(app);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span>{app.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
