import type { ConfigContext, ExpoConfig } from 'expo/config';

const PREVIEW_PROFILE = 'ui-preview';
const PREVIEW_ANDROID_PACKAGE = 'com.groceryapp.uipreview';

type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];

function isUiPreviewBuild(): boolean {
  // EAS client-apk profile must win over local .env (often EXPO_PUBLIC_UI_PREVIEW=on).
  if (process.env.EAS_BUILD_PROFILE === 'client-apk') {
    return true;
  }
  return process.env.EXPO_PUBLIC_UI_PREVIEW === PREVIEW_PROFILE;
}

function pluginName(plugin: ExpoPlugin): string {
  return typeof plugin === 'string' ? plugin : String(plugin[0]);
}

function withoutPlugin(plugins: ExpoConfig['plugins'], name: string): ExpoPlugin[] {
  return (plugins ?? []).filter((plugin) => pluginName(plugin) !== name);
}

function withAndroidBuildProperties(
  plugins: ExpoConfig['plugins'],
  android: Record<string, unknown>,
): ExpoPlugin[] {
  const next = withoutPlugin(plugins, 'expo-build-properties');
  next.push([
    'expo-build-properties',
    {
      android,
    },
  ]);
  return next;
}

/** Prefer platform-specific keys; fall back to one shared public key for bootstrap. */
function resolveGoogleMapsKeys() {
  const shared = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
  const android = (process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? shared).trim();
  const ios = (process.env.GOOGLE_MAPS_IOS_API_KEY ?? shared).trim();
  return { shared, android, ios };
}

function withGoogleMapsPlugin(plugins: ExpoConfig['plugins']): ExpoPlugin[] {
  const { android, ios } = resolveGoogleMapsKeys();
  const cleaned = withoutPlugin(
    withoutPlugin(plugins, 'react-native-maps'),
    '@maplibre/maplibre-react-native',
  );
  cleaned.push([
    'react-native-maps',
    {
      ...(android ? { androidGoogleMapsApiKey: android } : {}),
      ...(ios ? { iosGoogleMapsApiKey: ios } : {}),
    },
  ]);
  return cleaned;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const name = config.name ?? 'Mayapur Bazaar';
  const slug = config.slug ?? 'GroceryApp';
  const { shared, android, ios } = resolveGoogleMapsKeys();

  const sharedExtra = {
    ...config.extra,
    /** Mirrored for runtime fallback if Metro env inlining is stale. */
    expoPublicDevOtp: process.env.EXPO_PUBLIC_DEV_OTP ?? '',
    deliveryMapProvider: 'google-maps',
    googleMapsConfigured: Boolean(shared || android || ios),
  };

  // Keep WorkManager/Room constructor rules — SDK 58 enables R8 by default.
  const workManagerR8KeepRules = [
    '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
    '-keep class * extends androidx.work.InputMerger { <init>(); }',
    '-keep class com.swmansion.reanimated.** { *; }',
    '-keep class com.swmansion.worklets.** { *; }',
    '-keep class com.facebook.react.turbomodule.** { *; }',
    '-keep class expo.modules.** { *; }',
  ].join('\n');

  const stableAndroidBuildProps = {
    enableMinifyInReleaseBuilds: true,
    enableShrinkResourcesInReleaseBuilds: true,
    enableBundleCompression: true,
    extraProguardRules: workManagerR8KeepRules,
  };

  const androidWithMaps = {
    ...config.android,
    ...(android
      ? {
          config: {
            ...(config.android as { config?: Record<string, unknown> } | undefined)?.config,
            googleMaps: { apiKey: android },
          },
        }
      : {}),
  };

  const iosWithMaps = {
    ...config.ios,
    bundleIdentifier:
      (config.ios as { bundleIdentifier?: string } | undefined)?.bundleIdentifier ??
      'com.groceryapp.mayapurbazaar',
    ...(ios
      ? {
          config: {
            ...(config.ios as { config?: Record<string, unknown> } | undefined)?.config,
            googleMapsApiKey: ios,
          },
        }
      : {}),
  };

  if (!isUiPreviewBuild()) {
    return {
      ...config,
      name,
      slug,
      android: androidWithMaps,
      ios: iosWithMaps,
      plugins: withAndroidBuildProperties(withGoogleMapsPlugin(config.plugins), stableAndroidBuildProps),
      extra: sharedExtra,
    };
  }

  // Client download APK: arm64-only, no Google Maps / Cashfree / Camera+ML Kit (target under ~20MB).
  // Maps use the non-interactive panel; Cashfree uses WebView session checkout; QR shows a stub.
  // Autolink exclusions live in react-native.config.js when EXPO_PUBLIC_UI_PREVIEW=ui-preview.
  let previewPlugins = withoutPlugin(
    withoutPlugin(config.plugins, 'react-native-maps'),
    '@maplibre/maplibre-react-native',
  );
  previewPlugins = withoutPlugin(previewPlugins, 'expo-camera');
  previewPlugins = withoutPlugin(previewPlugins, 'expo-dev-client');

  return {
    ...config,
    name: 'Mayapur Bazaar',
    slug,
    scheme: 'groceryapp-preview',
    android: {
      ...config.android,
      package: PREVIEW_ANDROID_PACKAGE,
      versionCode: 12,
    },
    plugins: withAndroidBuildProperties(previewPlugins, {
      ...stableAndroidBuildProps,
      buildArchs: ['arm64-v8a'],
      useLegacyPackaging: true,
      gifEnabled: false,
      // App uses expo-image (Glide); RN Image WebP/GIF decoders are unused weight.
      webpEnabled: false,
      // aapt crunch can inflate already-optimized PNGs (icons/splash).
      enablePngCrunchInReleaseBuilds: false,
      networkInspector: false,
      packagingOptions: {
        exclude: [
          'lib/**/libbarhopper_v3.so',
          'lib/**/libgifimage.so',
          'lib/**/libanimation-decoder-gif.so',
          'lib/**/libavif_android.so',
          'lib/**/libstatic-webp.so',
          'assets/mlkit_barcode_models/**',
        ],
      },
    }),
    extra: {
      ...sharedExtra,
      uiPreview: true,
      slimClientApk: true,
      deliveryMapProvider: 'unavailable-client-apk',
      cashfreeCheckoutMode: 'webview',
    },
  };
};
