import type { ImageSource } from 'expo-image';

import {
  DEMO_NOTIFICATION_SEED,
  type NotificationArtKey,
} from '@/data/demoNotificationSeed';
import type { DemoNotification } from '@/types/notifications';

const ART: Record<NotificationArtKey, ImageSource> = {
  apples: require('@/assets/images/home/apples.jpg') as ImageSource,
  household: require('@/assets/images/home/household.jpg') as ImageSource,
  produce: require('@/assets/images/home/produce.jpg') as ImageSource,
  baby: require('@/assets/images/home/baby-care.jpg') as ImageSource,
  grocery: require('@/assets/images/home/cutouts/produce-offer.png') as ImageSource,
  bag: require('@/assets/images/home/cutouts/bread.png') as ImageSource,
  truck: require('@/assets/images/home/banner-produce.jpg') as ImageSource,
  milk: require('@/assets/images/home/product-milk.jpg') as ImageSource,
};

/**
 * Fictional Mayapur Bazaar inbox for UI preview only.
 * Seed lives in `demoNotificationSeed.ts` (Node-safe). Images attach here for the app.
 */
export const DEMO_NOTIFICATIONS: readonly DemoNotification[] = DEMO_NOTIFICATION_SEED.map((seed) => ({
  id: seed.id,
  type: seed.type,
  title: seed.title,
  body: seed.body,
  placedAtLabel: seed.placedAtLabel,
  unread: seed.unread,
  image: ART[seed.art],
  destination: seed.destination,
}));

export function findDemoNotification(id: string): DemoNotification | undefined {
  return DEMO_NOTIFICATIONS.find((item) => item.id === id);
}

export { DEMO_NOTIFICATION_SEED } from '@/data/demoNotificationSeed';
export { applyInboxState, countUnread } from '@/data/demoNotificationsLogic';
