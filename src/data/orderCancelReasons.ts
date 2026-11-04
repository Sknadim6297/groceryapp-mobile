/**
 * Grocery-oriented order cancellation reasons for the cancel feedback modal.
 * Preview / UI only until a live cancel API exists.
 */
export const ORDER_CANCEL_REASONS = [
  { id: 'change-of-mind', label: 'Change of mind.' },
  { id: 'better-price', label: 'Found a better price elsewhere.' },
  { id: 'poor-reviews', label: 'Poor customer reviews or feedback.' },
  { id: 'incorrect-item', label: 'Incorrect item ordered.' },
  { id: 'product-quality', label: 'Concern about product quality.' },
] as const;

export type OrderCancelReasonId = (typeof ORDER_CANCEL_REASONS)[number]['id'];

export function canCancelOrderStatus(status: string): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}
