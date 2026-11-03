import type { NotificationDestination, NotificationType } from '@/types/notifications';

export type DemoNotificationSeed = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  placedAtLabel: string;
  unread: boolean;
  art: NotificationArtKey;
  destination: NotificationDestination;
};

export type NotificationArtKey =
  | 'apples'
  | 'household'
  | 'produce'
  | 'baby'
  | 'grocery'
  | 'bag'
  | 'truck'
  | 'milk';

/**
 * Fictional Mayapur Bazaar inbox seed (no image requires — safe for Node tests).
 */
export const DEMO_NOTIFICATION_SEED: readonly DemoNotificationSeed[] = [
  {
    id: 'demo-notif-apple',
    type: 'product',
    title: 'Hurry! Apple is now in shop',
    body: 'Demo alert — fresh crunchy apples are available in the preview catalog.',
    placedAtLabel: 'Today, 12:00 AM',
    unread: true,
    art: 'apples',
    destination: { kind: 'product', productId: 'apples' },
  },
  {
    id: 'demo-notif-cleaner',
    type: 'offer',
    title: '75% Discount On Floor Cleaner',
    body: 'Demo offer card only. Household cleaners appear in the preview shop — not a live deal.',
    placedAtLabel: 'Today, 12:00 AM',
    unread: true,
    art: 'household',
    destination: { kind: 'category', categoryId: 'household' },
  },
  {
    id: 'demo-notif-veggies',
    type: 'product',
    title: 'Last chance to grab Vegetables',
    body: 'Demo scarcity banner. Explore produce in the preview catalog before this card is cleared.',
    placedAtLabel: 'Today, 12:00 AM',
    unread: true,
    art: 'produce',
    destination: { kind: 'product', productId: 'carrots' },
  },
  {
    id: 'demo-notif-first-purchase',
    type: 'coupon',
    title: 'Get 8% Off on First Purchase',
    body: 'Demo coupon teaser. Open Promocode to collect preview offers — nothing is redeemed live.',
    placedAtLabel: 'Today, 12:00 AM',
    unread: true,
    art: 'bag',
    destination: { kind: 'coupons' },
  },
  {
    id: 'demo-notif-baby',
    type: 'offer',
    title: 'Get your Baby for next step',
    body: 'Demo baby-care highlight. Browse the Baby Care category in the preview shop.',
    placedAtLabel: '2 Days ago',
    unread: false,
    art: 'baby',
    destination: { kind: 'category', categoryId: 'baby' },
  },
  {
    id: 'demo-notif-grocery-off',
    type: 'coupon',
    title: '8% Off on Online Grocery',
    body: 'Demo promotional notice. Preview coupons stay local and never hit payment APIs.',
    placedAtLabel: '2 Days ago',
    unread: false,
    art: 'grocery',
    destination: { kind: 'coupons' },
  },
  {
    id: 'demo-notif-order-out',
    type: 'out_for_delivery',
    title: 'Demo order is out for delivery',
    body: 'Order DEMO-2042 is on the way in preview tracking. Not a live delivery event.',
    placedAtLabel: 'Today · 11:05 AM',
    unread: true,
    art: 'truck',
    destination: { kind: 'order', orderId: 'DEMO-2042' },
  },
  {
    id: 'demo-notif-order-confirmed',
    type: 'order_confirmed',
    title: 'Demo order confirmed',
    body: 'DEMO-1875 was confirmed in the preview session. No store was contacted.',
    placedAtLabel: 'Today · 12:03 PM',
    unread: true,
    art: 'milk',
    destination: { kind: 'order', orderId: 'DEMO-1875' },
  },
  {
    id: 'demo-notif-order-placed',
    type: 'order_placed',
    title: 'Demo order placed',
    body: 'A preview checkout created DEMO-1875. This is not a paid live order.',
    placedAtLabel: 'Today · 12:01 PM',
    unread: false,
    art: 'bag',
    destination: { kind: 'order', orderId: 'DEMO-1875' },
  },
  {
    id: 'demo-notif-delivered',
    type: 'order_delivered',
    title: 'Demo order delivered',
    body: 'DEMO-1988 shows as delivered in preview history only.',
    placedAtLabel: '01 Nov · 9:18 AM',
    unread: false,
    art: 'grocery',
    destination: { kind: 'order', orderId: 'DEMO-1988' },
  },
  {
    id: 'demo-notif-welcome',
    type: 'announcement',
    title: 'Welcome to Mayapur Bazaar',
    body: 'Demo announcement. Account alerts will appear here when a live inbox is connected.',
    placedAtLabel: '01 Nov 2026',
    unread: false,
    art: 'grocery',
    destination: { kind: 'none' },
  },
];
