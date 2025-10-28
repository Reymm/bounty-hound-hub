import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  uploadedImages: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onUpload,
  onRemove,
  uploadedImages,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
        return;
      }

      // Check if we're at max files
      if (uploadedImages.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} images allowed`);
        return;
      }

      validFiles.push(file);
    });

    // Show error toast if there were any errors
    if (errors.length > 0) {
      toast({
        title: "Upload error",
        description: errors.join('. '),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        await onUpload(validFiles);
      } finally {
        setIsUploading(false);
      }
    }
  }, [uploadedImages.length, maxFiles, maxSize, onUpload, toast]);

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
          
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            {isUploading 
              ? "Uploading images..." 
              : isDragging 
                ? "Drop images here" 
                : "Drag & drop images here, or click to browse"
            }
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} images, {formatFileSize(maxSize)} each
          </p>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square border rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemove(imageUrl)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}