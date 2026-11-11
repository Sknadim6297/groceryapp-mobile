import { clearCollectedCouponIds } from '@/services/couponCollectionStore';
import { clearNotificationInboxStorage } from '@/services/notificationInboxStore';

let previewSessionReset: (() => void) | null = null;

/** Wired by PreviewSessionProvider so logout can clear in-memory demo orders/coupon. */
export function registerPreviewSessionReset(reset: (() => void) | null): void {
  previewSessionReset = reset;
}

/**
 * Clears demo coupon collection + notification inbox overrides on logout.
 * Also resets in-memory preview orders/coupon when registered.
 * Device app-settings preferences are intentionally kept.
 */
export async function clearPreviewAccountState(): Promise<void> {
  previewSessionReset?.();
  await Promise.all([clearCollectedCouponIds(), clearNotificationInboxStorage()]);
}
