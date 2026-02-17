import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function compressImage(file: File, maxBytes: number = MAX_SIZE): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.size <= maxBytes) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down large dimensions proportionally
      const maxDim = 2048;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Binary search for best quality that fits under maxBytes
      let lo = 0.1, hi = 0.95, bestBlob: Blob | null = null;

      for (let i = 0; i < 7; i++) {
        const mid = (lo + hi) / 2;
        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', mid));
        if (!blob) break;

        if (blob.size <= maxBytes) {
          bestBlob = blob;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      if (!bestBlob) {
        // Fallback: lowest quality
        bestBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.1));
      }

      if (!bestBlob || bestBlob.size > maxBytes) {
        reject(new Error('Não foi possível comprimir a imagem abaixo de 5MB'));
        return;
      }

      const ext = 'jpg';
      const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
      resolve(new File([bestBlob], name, { type: 'image/jpeg' }));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar imagem para compressão'));
    };

    img.src = url;
  });
}

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

      // Compress if needed instead of rejecting
      let processedFile = file;
      if (file.size > MAX_SIZE) {
        try {
          processedFile = await compressImage(file);
          toast.info('Imagem comprimida automaticamente');
        } catch {
          toast.error('Imagem muito grande e não pôde ser comprimida. Máximo: 5MB');
          return null;
        }
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setProgress(30);

      const { data, error } = await supabase.storage
        .from('location-images')
        .upload(fileName, processedFile, {
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
