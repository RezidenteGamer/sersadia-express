import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File, folder: string = 'locations'): Promise<string | null> => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas');
        return null;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Imagem muito grande. Máximo: 5MB');
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setProgress(30);

      const { data, error } = await supabase.storage
        .from('location-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(data.path);

      setProgress(100);
      
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const uploadMultipleImages = async (files: FileList, folder: string = 'locations'): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i], folder);
      if (url) {
        uploadedUrls.push(url);
      }
    }
    
    return uploadedUrls;
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const urlParts = url.split('/location-images/');
      if (urlParts.length < 2) return false;
      
      const path = urlParts[1];
      
      const { error } = await supabase.storage
        .from('location-images')
        .remove([path]);

      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Erro ao deletar imagem: ' + error.message);
      return false;
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    isUploading,
    progress,
  };
}
