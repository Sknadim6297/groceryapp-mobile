/**
 * Preview / client-apk builds omit MapLibre native libs so the sideload APK
 * can stay near the 20 MB client share limit. Location falls back to
 * search + manual address (DeliveryMap already handles a missing TurboModule).
 */
const slimClientApk = process.env.EXPO_PUBLIC_UI_PREVIEW === 'ui-preview';

module.exports = {
  dependencies: slimClientApk
    ? {
        '@maplibre/maplibre-react-native': {
          platforms: {
            android: null,
            ios: null,
          },
        },
      }
    : {},
};
