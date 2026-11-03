import { DEMO_NOTIFICATION_SEED } from '../src/data/demoNotificationSeed';
import { applyInboxState, countUnread } from '../src/data/demoNotificationsLogic';
import { sideMenuItems } from '../src/navigation/sideMenuItems';
import {
  clearNotificationInbox,
  installNotificationInboxStoreForTests,
  loadNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
  parseNotificationInbox,
  resetNotificationInboxDemo,
} from '../src/services/notificationInboxStore';
import { resolveNotificationRoute } from '../src/utils/notificationNavigation';
import type { DemoNotification } from '../src/types/notifications';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const FIXTURES: DemoNotification[] = DEMO_NOTIFICATION_SEED.map((seed) => ({
  id: seed.id,
  type: seed.type,
  title: seed.title,
  body: seed.body,
  placedAtLabel: seed.placedAtLabel,
  unread: seed.unread,
  image: 1 as never,
  destination: seed.destination,
}));

async function main() {
  assert(DEMO_NOTIFICATION_SEED.length >= 8, 'demo notifications required');
  assert(DEMO_NOTIFICATION_SEED.every((item) => item.id.startsWith('demo-notif-')), 'demo ids namespaced');
  assert(new Set(DEMO_NOTIFICATION_SEED.map((item) => item.type)).size >= 6, 'multiple notification categories');

  const seedUnread = applyInboxState(FIXTURES, { cleared: false, readIds: [] });
  assert(countUnread(seedUnread) >= 3, 'seed unread count');

  const afterRead = applyInboxState(FIXTURES, {
    cleared: false,
    readIds: [seedUnread.find((item) => item.isUnread)!.id],
  });
  assert(countUnread(afterRead) === countUnread(seedUnread) - 1, 'mark one read');

  const cleared = applyInboxState(FIXTURES, { cleared: true, readIds: [] });
  assert(cleared.length === 0 && countUnread(cleared) === 0, 'cleared inbox empty');

  assert(parseNotificationInbox(null).cleared === false, 'default inbox');
  assert(parseNotificationInbox('bad').readIds.length === 0, 'invalid json');

  installNotificationInboxStoreForTests(null);
  await markNotificationRead('demo-notif-apple');
  let inbox = await loadNotificationInbox();
  assert(inbox.readIds.includes('demo-notif-apple'), 'persisted read id');

  await markAllNotificationsRead(FIXTURES.map((item) => item.id));
  inbox = await loadNotificationInbox();
  assert(inbox.readIds.length >= FIXTURES.length, 'mark all read');

  await clearNotificationInbox();
  inbox = await loadNotificationInbox();
  assert(inbox.cleared === true, 'cleared flag');

  await resetNotificationInboxDemo();
  inbox = await loadNotificationInbox();
  assert(inbox.cleared === false && inbox.readIds.length === 0, 'reset demo inbox');

  assert(
    FIXTURES.find((item) => item.id === 'demo-notif-apple')?.destination.kind === 'product',
    'apple targets product destination',
  );

  const coupon = FIXTURES.find((item) => item.id === 'demo-notif-first-purchase')!;
  const couponRoute = resolveNotificationRoute(coupon);
  assert(couponRoute.kind === 'href' && couponRoute.href === '/coupons', 'coupon opens /coupons');

  const orderOut = FIXTURES.find((item) => item.id === 'demo-notif-order-out')!;
  const orderRoute = resolveNotificationRoute(orderOut);
  assert(orderRoute.kind === 'href', 'order notification resolves when seed order exists');

  const welcome = FIXTURES.find((item) => item.id === 'demo-notif-welcome')!;
  assert(resolveNotificationRoute(welcome).kind === 'details', 'announcement uses details sheet');

  assert(sideMenuItems.find((item) => item.label === 'Notification')?.href === '/notifications', 'sidebar route');

  console.log('notifications demo fixtures passed');
}

void main();
