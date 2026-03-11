import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Loader2, CheckCircle2, Expand, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNativePlatform, pickMultiplePhotosNative, pickPhotoNative } from '@/lib/native-camera';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface FileProgress {
  name: string;
  progress: number;
  completed: boolean;
  error?: string;
}

interface ImageUploadProps {
  onUpload: (files: File[], onProgress?: (fileName: string, progress: number) => void) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  onReorder?: (images: string[]) => void;
  uploadedImages: string[];
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onUpload,
  onRemove,
  onReorder,
  uploadedImages,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  className,
  disabled = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    
    const initialProgress: FileProgress[] = files.map(file => ({
      name: file.name,
      progress: 0,
      completed: false
    }));
    setFileProgress(initialProgress);

    try {
      await onUpload(files, (fileName: string, progress: number) => {
        setFileProgress(prev => 
          prev.map(fp => 
            fp.name === fileName 
              ? { ...fp, progress, completed: progress === 100 }
              : fp
          )
        );
      });
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setFileProgress([]);
    }
  };

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image`);
        return;
      }

      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
        return;
      }

      if (uploadedImages.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} images allowed`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: "Upload error",
        description: errors.join('. '),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      await uploadFiles(validFiles);
    }
  }, [uploadedImages.length, maxFiles, maxSize, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled, isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUploadMore = uploadedImages.length < maxFiles;

  return (
    <div className={cn("space-y-4", className)}>
      {canUploadMore && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging && !disabled ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && document.getElementById('image-input')?.click()}
        >
          <input
            id="image-input"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-3 w-full">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
              <p className="text-sm text-foreground font-medium text-center">
                Uploading {fileProgress.length} image{fileProgress.length > 1 ? 's' : ''}...
              </p>
              <div className="space-y-2 max-w-md mx-auto">
                {fileProgress.map((fp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[200px]">
                        {fp.name}
                      </span>
                      <span className="text-muted-foreground">
                        {fp.completed ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          `${fp.progress}%`
                        )}
                      </span>
                    </div>
                    <Progress value={fp.progress} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                {isDragging 
                  ? "Drop images here" 
                  : "Drag & drop images here, or click to browse"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} images, {formatFileSize(maxSize)} each
              </p>
            </>
          )}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((imageUrl, index) => (
            <div
              key={index}
              className={cn(
                "relative group border rounded-lg overflow-hidden bg-muted aspect-square cursor-pointer",
                index === 0 && "ring-2 ring-primary"
              )}
              onClick={() => setLightboxImage(imageUrl)}
            >
              {index === 0 && (
                <Badge className="absolute top-2 left-2 z-10 gap-1 bg-primary text-primary-foreground text-xs">
                  <Star className="h-3 w-3 fill-current" />
                  Main
                </Badge>
              )}
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && onReorder && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      const reordered = [imageUrl, ...uploadedImages.filter((_, i) => i !== index)];
                      onReorder(reordered);
                    }}
                    title="Set as main photo"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(imageUrl);
                  }}
                >
                  <Expand className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(imageUrl);
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}