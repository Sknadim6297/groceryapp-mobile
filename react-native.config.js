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
