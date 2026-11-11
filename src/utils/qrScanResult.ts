import type { Href } from 'expo-router';

import { findDemoSeedOrder } from '@/data/demoOrders';

export type QrActionKind = 'product' | 'order' | 'coupons' | 'category' | 'shop' | 'unsupported';

export type ParsedQrResult = {
  raw: string;
  kind: QrActionKind;
  title: string;
  detail: string;
  href?: Href;
  /** True when navigation is an in-app trusted destination. */
  canNavigate: boolean;
};

const APP_HOSTS = new Set(['mayapurbazaar.app', 'www.mayapurbazaar.app', 'groceryapp']);

/**
 * Safely interprets scanned QR payloads.
 * Never auto-opens arbitrary http(s) links or triggers payments.
 */
export function parseQrPayload(rawInput: string): ParsedQrResult {
  const raw = rawInput.trim();
  if (!raw) {
    return unsupported(raw, 'Empty QR code', 'Nothing was encoded in this code.');
  }

  const lower = raw.toLowerCase();

  if (looksLikePaymentIntent(lower)) {
    return unsupported(
      raw,
      'Payment QR not supported',
      'Mayapur Bazaar will not start a payment from a scanned code. Use checkout instead.',
    );
  }

  const deep = parseAppDeepLink(raw);
  if (deep) {
    return deep;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (APP_HOSTS.has(url.hostname.toLowerCase())) {
        const pathResult = parseInternalPath(`${url.pathname}${url.search}`);
        if (pathResult) {
          return pathResult;
        }
      }
    } catch {
      // fall through
    }
    return unsupported(
      raw,
      'External link blocked',
      'This QR points to an external website. For safety it was not opened automatically.',
    );
  }

  if (raw.startsWith('/')) {
    const pathResult = parseInternalPath(raw);
    if (pathResult) {
      return pathResult;
    }
  }

  // Bare product id style: product:apples or mbz:product:apples
  const productMatch = raw.match(/^(?:mbz:)?product[:/]([a-z0-9_-]+)$/i);
  if (productMatch?.[1]) {
    return {
      raw,
      kind: 'product',
      title: 'Product code',
      detail: `Open product “${productMatch[1]}” in the catalog.`,
      href: { pathname: '/product/[id]', params: { id: productMatch[1] } },
      canNavigate: true,
    };
  }

  const orderMatch = raw.match(/^(?:mbz:)?order[:/]([a-z0-9_-]+)$/i);
  if (orderMatch?.[1]) {
    const id = orderMatch[1];
    const exists = Boolean(findDemoSeedOrder(id));
    return {
      raw,
      kind: 'order',
      title: 'Order code',
      detail: exists
        ? `Open demo order ${id}.`
        : `Order id “${id}” was scanned. Open details only if this order exists in your account.`,
      href: { pathname: '/order/[id]', params: { id } },
      canNavigate: true,
    };
  }

  if (/^(?:mbz:)?coupons?$/i.test(raw) || lower === 'promocode') {
    return {
      raw,
      kind: 'coupons',
      title: 'Promocode',
      detail: 'Open the Promocode screen to view demo offers.',
      href: '/coupons',
      canNavigate: true,
    };
  }

  return unsupported(raw, 'Unsupported QR code', 'This code is not a recognized Mayapur Bazaar action.');
}

function parseAppDeepLink(raw: string): ParsedQrResult | null {
  // Accept production, brand, and preview schemes so older QR codes keep working.
  const match = raw.match(/^(?:groceryapp-preview|groceryapp|mayapurbazaar):\/\/(.+)$/i);
  if (!match?.[1]) {
    return null;
  }
  const path = `/${match[1].replace(/^\//, '')}`;
  return parseInternalPath(path);
}

function parseInternalPath(pathWithQuery: string): ParsedQrResult | null {
  const path = pathWithQuery.split('?')[0]?.replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'product' && segments[1]) {
    return {
      raw: pathWithQuery,
      kind: 'product',
      title: 'Product',
      detail: `Open product “${segments[1]}”.`,
      href: { pathname: '/product/[id]', params: { id: segments[1] } },
      canNavigate: true,
    };
  }
  if (segments[0] === 'order' && segments[1]) {
    return {
      raw: pathWithQuery,
      kind: 'order',
      title: 'Order',
      detail: `Open order “${segments[1]}”.`,
      href: { pathname: '/order/[id]', params: { id: segments[1] } },
      canNavigate: true,
    };
  }
  if (segments[0] === 'category' && segments[1]) {
    return {
      raw: pathWithQuery,
      kind: 'category',
      title: 'Category',
      detail: `Browse category “${segments[1]}”.`,
      href: { pathname: '/category/[id]', params: { id: segments[1] } },
      canNavigate: true,
    };
  }
  if (segments[0] === 'coupons' || segments[0] === 'promocode') {
    return {
      raw: pathWithQuery,
      kind: 'coupons',
      title: 'Promocode',
      detail: 'Open the Promocode screen.',
      href: '/coupons',
      canNavigate: true,
    };
  }
  if (segments[0] === 'shop' || path === '/') {
    return {
      raw: pathWithQuery,
      kind: 'shop',
      title: 'Shop',
      detail: 'Open the Shop tab.',
      href: '/shop',
      canNavigate: true,
    };
  }
  return null;
}

function looksLikePaymentIntent(lower: string): boolean {
  return (
    lower.startsWith('upi://') ||
    (lower.includes('pa=') && lower.includes('am=')) ||
    lower.startsWith('pay:') ||
    lower.includes('payment://') ||
    /razorpay|stripe|paytm|phonepe/i.test(lower)
  );
}

function unsupported(raw: string, title: string, detail: string): ParsedQrResult {
  return {
    raw,
    kind: 'unsupported',
    title,
    detail,
    canNavigate: false,
  };
}
