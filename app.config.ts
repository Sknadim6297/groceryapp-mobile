import type { ConfigContext, ExpoConfig } from 'expo/config';

const PREVIEW_PROFILE = 'ui-preview';
const PREVIEW_ANDROID_PACKAGE = 'com.groceryapp.uipreview';

type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];

function isUiPreviewBuild(): boolean {
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

function withMapLibrePlugin(plugins: ExpoConfig['plugins']): ExpoPlugin[] {
  const cleaned = withoutPlugin(withoutPlugin(plugins, 'react-native-maps'), '@maplibre/maplibre-react-native');
  cleaned.push('@maplibre/maplibre-react-native');
  return cleaned;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const name = config.name ?? 'Mayapur Bazaar';
  const slug = config.slug ?? 'GroceryApp';

  const sharedExtra = {
    ...config.extra,
    /** Mirrored for runtime fallback if Metro env inlining is stale. */
    expoPublicDevOtp: process.env.EXPO_PUBLIC_DEV_OTP ?? '',
    /** Delivery map uses OpenFreeMap + MapLibre (no Google Maps key). */
    deliveryMapProvider: 'maplibre-openfreemap',
  };

  // Keep WorkManager/Room constructor rules even after removing react-native-maps —
  // other AndroidX deps can still pull WorkManager, and SDK 58 enables R8 by default.
  const workManagerR8KeepRules = [
    '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
    '-keep class * extends androidx.work.InputMerger { <init>(); }',
    '-keep class com.swmansion.reanimated.** { *; }',
    '-keep class com.swmansion.worklets.** { *; }',
    '-keep class com.facebook.react.turbomodule.** { *; }',
    '-keep class expo.modules.** { *; }',
    '-keep class org.maplibre.** { *; }',
    '-keep class com.mapbox.mapboxsdk.** { *; }',
  ].join('\n');

  const stableAndroidBuildProps = {
    enableMinifyInReleaseBuilds: true,
    enableShrinkResourcesInReleaseBuilds: true,
    enableBundleCompression: true,
    extraProguardRules: workManagerR8KeepRules,
  };

  if (!isUiPreviewBuild()) {
    return {
      ...config,
      name,
      slug,
      plugins: withAndroidBuildProperties(withMapLibrePlugin(config.plugins), stableAndroidBuildProps),
      extra: sharedExtra,
    };
  }

  // Client / preview APK: arm64-only, no MapLibre .so (often 10–20 MB alone),
  // so the shareable APK can stay under ~20 MB. Maps use the existing fallback UI.
  const previewPlugins = withoutPlugin(
    withoutPlugin(config.plugins, 'react-native-maps'),
    '@maplibre/maplibre-react-native',
  );

  return {
    ...config,
    name: 'Mayapur Bazaar Preview',
    slug,
    scheme: 'groceryapp-preview',
    android: {
      ...config.android,
      package: PREVIEW_ANDROID_PACKAGE,
      versionCode: 8,
    },
    plugins: withAndroidBuildProperties(previewPlugins, {
      ...stableAndroidBuildProps,
      buildArchs: ['arm64-v8a'],
      useLegacyPackaging: true,
    }),
    extra: {
      ...sharedExtra,
      uiPreview: true,
      deliveryMapProvider: 'unavailable-client-apk',
    },
  };
};
