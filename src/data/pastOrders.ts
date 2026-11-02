import type { CustomerOrder } from '@/types/order';

export type PastOrdersState =
  | { kind: 'empty'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; orders: CustomerOrder[] };

/**
 * The published customer API has register, send-otp, resend-otp, and verify-otp.
 * It does not publish an order-list endpoint, so this does not invent orders.
 */
export function readPastOrders(): PastOrdersState {
  return {
    kind: 'empty',
    message: 'No past orders yet. They will show here when the store service sends them.',
  };
}

export function findPastOrder(id: string): CustomerOrder | null {
  const state = readPastOrders();
  if (state.kind !== 'ready') {
    return null;
  }
  return state.orders.find((order) => order.id === id) ?? null;
}
