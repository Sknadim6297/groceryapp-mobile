import { findDemoSeedOrder } from '@/data/demoOrders';
import type { DemoNotification, ResolvedNotificationRoute } from '@/types/notifications';

/**
 * Resolves a demo notification tap to an in-app route.
 * Falls back to a details sheet when the destination is invalid.
 * Product catalog is required lazily so Node tests avoid image `require`s.
 */
export function resolveNotificationRoute(notification: DemoNotification): ResolvedNotificationRoute {
  switch (notification.destination.kind) {
    case 'product': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { findDemoProduct } = require('@/data/findDemoProduct') as typeof import('@/data/findDemoProduct');
      const product = findDemoProduct(notification.destination.productId);
      if (!product) {
        return { kind: 'details' };
      }
      return { kind: 'href', href: { pathname: '/product/[id]', params: { id: product.id } } };
    }
    case 'order': {
      const order = findDemoSeedOrder(notification.destination.orderId);
      if (!order) {
        return { kind: 'details' };
      }
      return { kind: 'href', href: { pathname: '/order/[id]', params: { id: order.id } } };
    }
    case 'coupons':
      return { kind: 'href', href: '/coupons' };
    case 'category':
      return {
        kind: 'href',
        href: { pathname: '/category/[id]', params: { id: notification.destination.categoryId } },
      };
    case 'none':
    default:
      return { kind: 'details' };
  }
}
