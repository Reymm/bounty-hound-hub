import { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isNativePlatform, pickPhotoNative } from '@/lib/native-camera';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  fallbackText: string;
  onAvatarChange: (url: string | null) => void;
  disabled?: boolean;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  fallbackText, 
  onAvatarChange, 
  disabled = false 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload directly
    uploadAvatar(file);
    
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onAvatarChange(data.publicUrl);
      setPreviewUrl(null);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been successfully updated.",
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      // If there's a current URL, try to delete the file
      if (currentAvatarUrl && currentAvatarUrl.includes('supabase')) {
        const url = new URL(currentAvatarUrl);
        const filePath = url.pathname.split('/avatars/')[1];
        
        if (filePath) {
          await supabase.storage
            .from('avatars')
            .remove([filePath]);
        }
      }

      onAvatarChange(null);
      setPreviewUrl(null);

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt="Profile picture" />
          ) : null}
          <AvatarFallback className="text-2xl">
            {fallbackText || <User className="h-10 w-10 text-muted-foreground" />}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {!disabled && (
          <Button
            type="button"
            size="sm"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
            onClick={async () => {
              if (isNativePlatform()) {
                try {
                  const file = await pickPhotoNative();
                  if (file) { uploadAvatar(file); return; }
                } catch (e) {
                  console.error('Native camera failed, falling back:', e);
                }
              }
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {!disabled && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isNativePlatform()) {
                  const file = await pickPhotoNative();
                  if (file) uploadAvatar(file);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            
            {(currentAvatarUrl || previewUrl) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeAvatar}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}