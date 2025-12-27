import { supabase } from "@/integrations/supabase/client";

export type StorageBucket = 'bounty-images' | 'submission-files' | 'avatars' | 'documents';

export interface UploadResult {
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  completed: boolean;
  error?: string;
}

/**
 * Verify that an image URL actually exists and is accessible
 */
export const verifyImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Verify multiple image URLs exist
 */
export const verifyImagesExist = async (urls: string[]): Promise<{ valid: string[]; invalid: string[] }> => {
  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      exists: await verifyImageExists(url)
    }))
  );
  
  return {
    valid: results.filter(r => r.exists).map(r => r.url),
    invalid: results.filter(r => !r.exists).map(r => r.url)
  };
};

export const uploadFile = async (
  file: File,
  bucket: StorageBucket,
  userId: string,
  customPath?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    console.log('[STORAGE] Starting upload:', { fileName: file.name, fileSize: file.size, bucket, userId });
    
    const fileExt = file.name.split('.').pop();
    const fileName = customPath || `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('[STORAGE] Uploading to path:', filePath);

    // Simulate gradual progress since Supabase doesn't provide real upload progress
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += 10;
        onProgress?.(currentProgress);
      }
    }, 200); // Update every 200ms

    try {
      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      onProgress?.(95);

      console.log('[STORAGE] Upload response:', { uploadData, error });

      if (error) {
        console.error('[STORAGE] Upload error:', error);
        throw error;
      }

      // Get public URL for public buckets, signed URL for private ones
      const isPublicBucket = bucket === 'bounty-images' || bucket === 'avatars';
      
      console.log('[STORAGE] Getting URL for public bucket:', isPublicBucket);
      
      let finalUrl: string;
      
      if (isPublicBucket) {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        finalUrl = data.publicUrl;
        console.log('[STORAGE] Public URL generated:', finalUrl);
      } else {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600 * 24); // 24 hours
        
        if (signError) {
          console.error('[STORAGE] Signed URL error:', signError);
          throw signError;
        }
        
        finalUrl = data.signedUrl;
        console.log('[STORAGE] Signed URL generated');
      }
      
      // CRITICAL: Verify the file actually exists before returning
      console.log('[STORAGE] Verifying upload exists...');
      const exists = await verifyImageExists(finalUrl);
      
      if (!exists) {
        console.error('[STORAGE] Upload verification failed - file does not exist at URL');
        throw new Error('Upload verification failed - file was not saved correctly');
      }
      
      console.log('[STORAGE] Upload verified successfully');
      onProgress?.(100);
      return { url: finalUrl, path: filePath };
      
    } catch (uploadError) {
      clearInterval(progressInterval);
      throw uploadError;
    }
  } catch (error: any) {
    console.error('[STORAGE] Upload failed:', error);
    return { error: error.message };
  }
};

export const deleteFile = async (
  bucket: StorageBucket,
  filePath: string
): Promise<{ error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return {};
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getFileUrl = async (
  bucket: StorageBucket,
  filePath: string,
  expiresIn = 3600
): Promise<string | null> => {
  try {
    const isPublicBucket = bucket === 'bounty-images' || bucket === 'avatars';
    
    if (isPublicBucket) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } else {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) return null;
      return data.signedUrl;
    }
  } catch {
    return null;
  }
};