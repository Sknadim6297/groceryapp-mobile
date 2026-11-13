const slimClientApk =
  process.env.EAS_BUILD_PROFILE === 'client-apk' ||
  process.env.EXPO_PUBLIC_UI_PREVIEW === 'ui-preview';

module.exports = {
  dependencies: slimClientApk
    ? {
        // Slim download APK skips heavy native SDKs to stay under ~20MB.
        'react-native-maps': {
          platforms: {
            android: null,
            ios: null,
          },
        },
        'react-native-cashfree-pg-sdk': {
          platforms: {
            android: null,
            ios: null,
          },
        },
        // ML Kit barcode (libbarhopper) + models are several MB.
        'expo-camera': {
          platforms: {
            android: null,
            ios: null,
          },
        },
      }
    : {},
};
