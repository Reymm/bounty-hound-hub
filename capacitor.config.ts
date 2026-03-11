import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'co.bountybay.app',
  appName: 'BountyBay',
  webDir: 'dist',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith('http://'),
        },
      }
    : {}),
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    scheme: 'BountyBay',
    // Persist Info.plist entries across cap sync
    appendToInfoPlist: {
      NSCameraUsageDescription: 'BountyBay needs camera access to take profile photos and upload proof images.',
      NSPhotoLibraryUsageDescription: 'BountyBay needs photo library access to upload profile photos and proof images.',
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: 'BountyBay',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
