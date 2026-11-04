import type { CustomerOrder } from '@/types/order';

/**
 * Formats backend/order-provided ETA only.
 * Never invents clock ranges like "12:30 PM – 01:00 PM".
 */
export function formatTrackingEtaLabel(order: CustomerOrder): string | null {
  const value = order.eta?.value?.trim();
  if (!value) {
    return null;
  }
  const unit = order.eta?.unit?.trim() ?? '';
  return unit ? `${value} ${unit}` : value;
}

export function trackingEtaFallbackLabel(): string {
  return 'Delivery time updating';
}
