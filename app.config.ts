import type { ConfigContext, ExpoConfig } from 'expo/config';

const PREVIEW_PROFILE = 'ui-preview';
const PREVIEW_ANDROID_PACKAGE = 'com.groceryapp.uipreview';

function isUiPreviewBuild(): boolean {
  return process.env.EXPO_PUBLIC_UI_PREVIEW === PREVIEW_PROFILE;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const name = config.name ?? 'PhoneBook ERP';
  const slug = config.slug ?? 'GroceryApp';

  if (!isUiPreviewBuild()) {
    return {
      ...config,
      name,
      slug,
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
    name: 'GroceryApp Preview',
    slug,
    scheme: 'groceryapp-preview',
    android: {
      ...config.android,
      package: PREVIEW_ANDROID_PACKAGE,
      versionCode: 2,
    },
    plugins,
    extra: {
      ...config.extra,
      uiPreview: true,
    },
  };
};
