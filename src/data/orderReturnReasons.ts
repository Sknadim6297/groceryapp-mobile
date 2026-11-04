/**
 * Grocery-oriented return & refund reasons for the return feedback modal.
 * Preview / UI only until a live returns API exists.
 */
export const ORDER_RETURN_REASONS = [
  { id: 'change-of-mind', label: 'Change of mind.' },
  { id: 'better-price', label: 'Found a better price elsewhere.' },
  { id: 'poor-reviews', label: 'Poor customer reviews or feedback.' },
  { id: 'incorrect-item', label: 'Incorrect item ordered.' },
  { id: 'product-quality', label: 'Concern about product quality.' },
] as const;

export type OrderReturnReasonId = (typeof ORDER_RETURN_REASONS)[number]['id'];

export function canReturnOrderStatus(status: string, returnRequested?: boolean): boolean {
  return status === 'delivered' && !returnRequested;
}
