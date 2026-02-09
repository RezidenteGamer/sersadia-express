import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paintbrush, X, Check, Image, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WallpaperConfig, PRESET_WALLPAPERS, PRESET_IMAGE_WALLPAPERS, getWallpaperStyle } from './wallpaperConfig';

interface WallpaperSettingsProps {
  open: boolean;
  onClose: () => void;
  current: WallpaperConfig;
  onApply: (config: WallpaperConfig) => void;
  onUploadFile?: (file: File) => Promise<string | null>;
}

export function WallpaperSettings({ open, onClose, current, onApply, onUploadFile }: WallpaperSettingsProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    if (onUploadFile) {
      setUploading(true);
      const url = await onUploadFile(file);
      setUploading(false);
      if (url) {
        onApply({ type: 'image', value: url });
      }
    } else {
      // Fallback to data URL (won't persist across browsers)
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onApply({ type: 'image', value: dataUrl });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-[520px] max-h-[85vh] bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold text-foreground">Papel de Parede</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Gradient/Solid Presets */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Predefinidos</h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {PRESET_WALLPAPERS.map((preset, i) => {
                      const isActive = JSON.stringify(current) === JSON.stringify(preset.config);
                      return (
                        <button
                          key={i}
                          onClick={() => onApply(preset.config)}
                          className={cn(
                            "relative rounded-xl overflow-hidden h-20 border-2 transition-all group",
                            isActive ? "border-primary shadow-lg" : "border-border/40 hover:border-border"
                          )}
                        >
                          <div className="absolute inset-0" style={getWallpaperStyle(preset.config)} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-medium">
                            {preset.label}
                          </span>
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Presets */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Imagens Ser Sadia</h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {PRESET_IMAGE_WALLPAPERS.map((preset, i) => {
                      const isActive = current.type === 'image' && current.value === preset.config.value;
                      return (
                        <button
                          key={i}
                          onClick={() => onApply(preset.config)}
                          className={cn(
                            "relative rounded-xl overflow-hidden h-20 border-2 transition-all group",
                            isActive ? "border-primary shadow-lg" : "border-border/40 hover:border-border"
                          )}
                        >
                          <div className="absolute inset-0" style={getWallpaperStyle(preset.config)} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-medium">
                            {preset.label}
                          </span>
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload local image */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Enviar imagem do computador</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-colors text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Enviando...' : 'Selecionar imagem...'}
                  </button>
                </div>

                {/* Custom image URL */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Ou usar URL de imagem</h3>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="URL da imagem..."
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-muted/50 border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customUrl.trim()) {
                          onApply({ type: 'image', value: customUrl.trim() });
                        }
                      }}
                      disabled={!customUrl.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Custom solid color */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Cor sólida</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue={current.type === 'solid' ? current.value : '#1a1a1a'}
                      onChange={(e) => onApply({ type: 'solid', value: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-border/40 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground">Selecione uma cor</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
