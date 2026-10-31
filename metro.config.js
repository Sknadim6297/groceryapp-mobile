const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const assetPrefix = '@/assets/';

const shipPreviewUrls =
  process.env.EXPO_PUBLIC_UI_PREVIEW === 'ui-preview' || process.env.NODE_ENV !== 'production';

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (!shipPreviewUrls && /previewImageCatalog(?!\.stub)/.test(moduleName)) {
    return context.resolveRequest(
      context,
      moduleName.replace('previewImageCatalog', 'previewImageCatalog.stub'),
      platform,
    );
  }

  if (moduleName.startsWith(assetPrefix)) {
    const absolute = path.join(projectRoot, 'assets', moduleName.slice(assetPrefix.length));
    let relative = path.relative(path.dirname(context.originModulePath), absolute);
    relative = relative.split(path.sep).join('/');
    if (!relative.startsWith('.')) {
      relative = `./${relative}`;
    }
    return context.resolveRequest(context, relative, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
