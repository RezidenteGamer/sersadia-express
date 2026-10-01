import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxSize = 5 * 1024 * 1024;

export function useReceiptUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadReceipt = async (reservationId: string, file: File) => {
    if (!user) throw new Error('Entre na sua conta para enviar o comprovante.');
    if (!allowedTypes.has(file.type)) throw new Error('Envie uma imagem JPG, PNG, WebP ou PDF.');
    if (file.size > maxSize) throw new Error('O comprovante deve ter até 5 MB.');

    const extension = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${user.id}/${reservationId}/${crypto.randomUUID()}.${extension}`;
    setIsUploading(true);
    try {
      const { error } = await supabase.storage.from('receipts').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      return path;
    } finally {
      setIsUploading(false);
    }
  };

  const removeUnusedReceipt = async (path: string) => {
    await supabase.storage.from('receipts').remove([path]);
  };

  return { uploadReceipt, removeUnusedReceipt, isUploading };
}
