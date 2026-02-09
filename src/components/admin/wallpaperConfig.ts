export interface WallpaperConfig {
  type: 'solid' | 'gradient' | 'image';
  value: string; // color hex, gradient css, or image url
}

const WALLPAPER_KEY = 'admin-desktop-wallpaper';

const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'gradient',
  value: 'linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-background) / 0.85) 40%, hsl(var(--primary) / 0.12) 100%)',
};

export const PRESET_WALLPAPERS: { label: string; config: WallpaperConfig }[] = [
  { label: 'Padrão', config: DEFAULT_WALLPAPER },
  { label: 'Noite Profunda', config: { type: 'gradient', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' } },
  { label: 'Aurora', config: { type: 'gradient', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)' } },
  { label: 'Sunset', config: { type: 'gradient', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' } },
  { label: 'Forest', config: { type: 'gradient', value: 'linear-gradient(135deg, #0d1b0e 0%, #1a3a1a 50%, #2d5a2d 100%)' } },
  { label: 'Midnight Blue', config: { type: 'gradient', value: 'linear-gradient(135deg, #020024 0%, #090979 50%, #00d4ff20 100%)' } },
  { label: 'Charcoal', config: { type: 'solid', value: '#1a1a1a' } },
  { label: 'Slate', config: { type: 'solid', value: '#1e293b' } },
  { label: 'Dark Navy', config: { type: 'solid', value: '#0f172a' } },
];

export function loadWallpaper(): WallpaperConfig {
  try {
    const saved = localStorage.getItem(WALLPAPER_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_WALLPAPER;
  } catch { return DEFAULT_WALLPAPER; }
}

export function saveWallpaper(config: WallpaperConfig) {
  localStorage.setItem(WALLPAPER_KEY, JSON.stringify(config));
}

export function getWallpaperStyle(config: WallpaperConfig): React.CSSProperties {
  switch (config.type) {
    case 'solid':
      return { background: config.value };
    case 'gradient':
      return { background: config.value };
    case 'image':
      return {
        backgroundImage: `url(${config.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    default:
      return {};
  }
}
