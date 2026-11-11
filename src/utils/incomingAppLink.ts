import type { Href } from 'expo-router';

import { parseQrPayload } from '@/utils/qrScanResult';

/**
 * Paths that the splash screen is allowed to route to from a cold-start URL.
 * Auth-gated screens still enforce login themselves.
 */
const BLOCKED_SPLASH_PATHS = new Set([
  '',
  '/',
  'index',
  '--',
  'intro',
  'login',
  'otp',
  'uilab',
]);

/**
 * True when the URL is a meaningful in-app destination (not bare launch / splash).
 */
export function isColdStartDeepLink(url: string | null | undefined): boolean {
  return resolveIncomingAppHref(url) != null;
}

/**
 * Maps groceryapp://, mayapurbazaar://, https://mayapurbazaar.app/…, and path URLs
 * to an Expo Router href. Returns null for bare app launches.
 */
export function resolveIncomingAppHref(url: string | null | undefined): Href | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Expo Linking may hand a path-only string on some platforms.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : trimmed.startsWith('/')
      ? trimmed
      : `/${trimmed.replace(/^\/*/, '')}`;

  const parsed = parseQrPayload(candidate);
  if (!parsed.canNavigate || !parsed.href) {
    // Also accept https host paths via parseQrPayload; if still nothing, try raw path.
    if (candidate.startsWith('/')) {
      const segments = candidate.split('?')[0]?.split('/').filter(Boolean) ?? [];
      const head = segments[0] ?? '';
      if (BLOCKED_SPLASH_PATHS.has(head) || BLOCKED_SPLASH_PATHS.has(candidate)) {
        return null;
      }
    }
    return null;
  }

  const href = parsed.href;
  if (typeof href === 'string') {
    const path = href.split('?')[0]?.replace(/^\//, '') ?? '';
    const head = path.split('/')[0] ?? '';
    if (BLOCKED_SPLASH_PATHS.has(path) || BLOCKED_SPLASH_PATHS.has(head) || path.length === 0) {
      return null;
    }
    return href;
  }

  const pathname = typeof href.pathname === 'string' ? href.pathname : '';
  const head = pathname.replace(/^\//, '').split('/')[0] ?? '';
  if (BLOCKED_SPLASH_PATHS.has(head)) {
    return null;
  }
  return href;
}
