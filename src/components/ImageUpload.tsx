import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  className 
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, deleteImage, isUploading, progress } = useImageUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      const url = await uploadImage(file);
      if (url) {
        onImagesChange([...images, url]);
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    const url = images[index];
    // Try to delete from storage (will fail silently if not our image)
    await deleteImage(url);
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div 
              key={url} 
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              <img 
                src={url} 
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
              <div className="text-sm text-muted-foreground">Enviando imagem...</div>
              <Progress value={progress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">
                Clique ou arraste imagens aqui
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                PNG, JPG ou WEBP até 5MB • {images.length}/{maxImages} imagens
              </div>
            </>
          )}
        </div>
      )}

      {/* URL Input Option */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          Ou adicione URLs de imagens externas no campo abaixo
        </span>
      </div>
    </div>
  );
}
