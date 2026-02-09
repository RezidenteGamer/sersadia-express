import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WallpaperConfig, saveWallpaper } from '@/components/admin/wallpaperConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useWallpaperSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load wallpaper preference from DB
  const { data: dbWallpaper } = useQuery({
    queryKey: ['wallpaper-preference', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('admin_wallpaper_preferences')
        .select('wallpaper_config')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.wallpaper_config) {
        const config = data.wallpaper_config as unknown as WallpaperConfig;
        saveWallpaper(config); // sync to localStorage too
        return config;
      }
      return null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Save wallpaper preference to DB
  const saveMutation = useMutation({
    mutationFn: async (config: WallpaperConfig) => {
      if (!user) return;
      const { error } = await supabase
        .from('admin_wallpaper_preferences')
        .upsert({
          user_id: user.id,
          wallpaper_config: config as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallpaper-preference'] });
    },
  });

  // Upload local file to storage and return URL
  const uploadWallpaperFile = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('admin-wallpapers')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) return null;
    const { data: urlData } = supabase.storage
      .from('admin-wallpapers')
      .getPublicUrl(path);
    return urlData.publicUrl;
  }, [user]);

  const saveAndSync = useCallback((config: WallpaperConfig) => {
    saveWallpaper(config);
    saveMutation.mutate(config);
  }, [saveMutation]);

  return { dbWallpaper, saveAndSync, uploadWallpaperFile };
}
