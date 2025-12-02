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

    // Simulate progress since Supabase doesn't provide upload progress
    // Report progress at different stages
    onProgress?.(20);

    const { data: uploadData, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    onProgress?.(80);

    console.log('[STORAGE] Upload response:', { uploadData, error });

    if (error) {
      console.error('[STORAGE] Upload error:', error);
      throw error;
    }

    // Get public URL for public buckets, signed URL for private ones
    const isPublicBucket = bucket === 'bounty-images' || bucket === 'avatars';
    
    console.log('[STORAGE] Getting URL for public bucket:', isPublicBucket);
    
    if (isPublicBucket) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      console.log('[STORAGE] Public URL generated:', data.publicUrl);
      onProgress?.(100);
      return { url: data.publicUrl, path: filePath };
    } else {
      const { data, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600 * 24); // 24 hours
      
      if (signError) {
        console.error('[STORAGE] Signed URL error:', signError);
        throw signError;
      }
      
      console.log('[STORAGE] Signed URL generated');
      onProgress?.(100);
      return { url: data.signedUrl, path: filePath };
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