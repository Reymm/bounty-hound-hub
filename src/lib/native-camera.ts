import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Check if running on a native platform (iOS/Android)
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Pick a photo using Capacitor Camera plugin (native) or return null to fall back to HTML input.
 * Returns a File object on success, or null if cancelled/unavailable.
 */
export async function pickPhotoNative(): Promise<File | null> {
  if (!isNativePlatform()) return null;

  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Let user choose camera or gallery
      quality: 85,
      allowEditing: false,
      width: 1200,
      height: 1200,
    });

    if (!photo.dataUrl) return null;

    // Convert data URL to File
    const response = await fetch(photo.dataUrl);
    const blob = await response.blob();
    const extension = photo.format || 'jpeg';
    const fileName = `photo_${Date.now()}.${extension}`;
    return new File([blob], fileName, { type: `image/${extension}` });
  } catch (error: any) {
    // User cancelled - not an error
    if (error?.message?.includes('cancelled') || error?.message?.includes('User cancelled')) {
      return null;
    }
    console.error('Native camera error:', error);
    return null;
  }
}

/**
 * Pick multiple photos using Capacitor Camera plugin.
 * Returns an array of File objects.
 */
export async function pickMultiplePhotosNative(): Promise<File[]> {
  if (!isNativePlatform()) return [];

  try {
    const result = await Camera.pickImages({
      quality: 85,
      width: 1200,
      height: 1200,
    });

    const files: File[] = [];
    for (const photo of result.photos) {
      try {
        // pickImages returns webPath
        if (photo.webPath) {
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          const extension = photo.format || 'jpeg';
          const fileName = `photo_${Date.now()}_${files.length}.${extension}`;
          files.push(new File([blob], fileName, { type: `image/${extension}` }));
        }
      } catch (e) {
        console.error('Error converting photo:', e);
      }
    }
    return files;
  } catch (error: any) {
    if (error?.message?.includes('cancelled') || error?.message?.includes('User cancelled')) {
      return [];
    }
    console.error('Native photo picker error:', error);
    return [];
  }
}
