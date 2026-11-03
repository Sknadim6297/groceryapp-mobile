import type { ConfigContext, ExpoConfig } from 'expo/config';

const PREVIEW_PROFILE = 'ui-preview';
const PREVIEW_ANDROID_PACKAGE = 'com.groceryapp.uipreview';

function isUiPreviewBuild(): boolean {
  return process.env.EXPO_PUBLIC_UI_PREVIEW === PREVIEW_PROFILE;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const name = config.name ?? 'Mayapur Bazaar';
  const slug = config.slug ?? 'GroceryApp';

  const sharedExtra = {
    ...config.extra,
    /** Mirrored for runtime fallback if Metro env inlining is stale. */
    expoPublicDevOtp: process.env.EXPO_PUBLIC_DEV_OTP ?? '',
  };

  if (!isUiPreviewBuild()) {
    return {
      ...config,
      name,
      slug,
      extra: sharedExtra,
    };
  }

  const plugins = (config.plugins ?? []).filter((plugin) => {
    const pluginName = typeof plugin === 'string' ? plugin : plugin[0];
    return pluginName !== 'expo-location';
  });

  plugins.push([
    'expo-build-properties',
    {
      android: {
        buildArchs: ['arm64-v8a'],
      },
    },
  ]);

  return {
    ...config,
    name: 'Mayapur Bazaar Preview',
    slug,
    scheme: 'groceryapp-preview',
    android: {
      ...config.android,
      package: PREVIEW_ANDROID_PACKAGE,
      versionCode: 2,
    },
    plugins,
    extra: {
      ...sharedExtra,
      uiPreview: true,
    },
  };
};
