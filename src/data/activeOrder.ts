import type { ActiveOrderState } from '@/types/order';

/**
 * Order tracking is not connected to an order service.
 * This stays empty until a real order source provides an id, status, address, and partner.
 */
export function readActiveOrder(): ActiveOrderState {
  return { kind: 'empty' };
}
