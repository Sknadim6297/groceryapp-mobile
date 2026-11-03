const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const assetPrefix = '@/assets/';

// Node on Windows fails with EMFILE when Metro transforms on every CPU core at once.
config.maxWorkers = 2;

const shipPreviewUrls =
  process.env.EXPO_PUBLIC_UI_PREVIEW === 'ui-preview' || process.env.NODE_ENV !== 'production';

const liveApiBase = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://api.supertrading.online'
).replace(/\/+$/, '');

/**
 * Expo web runs in the browser. The live API does not send Access-Control-Allow-Origin
 * and OPTIONS returns 405, so direct cross-origin calls fail with "Unable to connect".
 * Proxy /api/* through Metro (same origin) for web development only. Native clients
 * never hit this middleware.
 */
const apiProxy = createProxyMiddleware({
  target: liveApiBase,
  changeOrigin: true,
  secure: true,
  // Keep path as /api/... — matches CUSTOMER_API routes on the C# host.
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api/')) {
        return apiProxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

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
