import type { Href } from 'expo-router';
import type { ImageSource } from 'expo-image';

export const notificationTypes = [
  'product',
  'offer',
  'order_placed',
  'order_confirmed',
  'out_for_delivery',
  'order_delivered',
  'coupon',
  'announcement',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type NotificationDestination =
  | { kind: 'product'; productId: string }
  | { kind: 'order'; orderId: string }
  | { kind: 'coupons' }
  | { kind: 'category'; categoryId: string }
  | { kind: 'none' };

/**
 * Frontend demo inbox row.
 * Never treat as a live push payload or C# notification record.
 */
export type DemoNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  placedAtLabel: string;
  /** Seed unread flag before local inbox overrides. */
  unread: boolean;
  image: ImageSource;
  destination: NotificationDestination;
};

export type NotificationInboxState = {
  /** When true, the demo inbox was cleared locally. */
  cleared: boolean;
  /** Ids marked read on this device. */
  readIds: string[];
};

export type NotificationListItem = DemoNotification & {
  isUnread: boolean;
};

export type ResolvedNotificationRoute =
  | { kind: 'href'; href: Href }
  | { kind: 'details' };
