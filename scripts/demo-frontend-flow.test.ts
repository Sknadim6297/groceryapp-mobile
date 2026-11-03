import { DEMO_SEED_ORDERS, findDemoSeedOrder } from '../src/data/demoOrders';
import { DEMO_NOTIFICATION_SEED } from '../src/data/demoNotificationSeed';
import { DEMO_TRANSACTIONS } from '../src/data/demoTransactions';
import { previewCoupons } from '../src/data/previewCoupons';
import { findPastOrder, readPastOrders } from '../src/data/pastOrders';
import { sideMenuItems } from '../src/navigation/sideMenuItems';
import { buildDemoCheckoutBill, DEMO_DELIVERY_FEE } from '../src/utils/demoCheckoutBill';
import { buildOrderTimeline, filterOrders } from '../src/utils/orderListing';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Real past-order book stays empty (demo lives in PreviewSession / DEMO_SEED_ORDERS).
assert(readPastOrders().kind === 'empty', 'real pastOrders must stay empty');
assert(findPastOrder('DEMO-2042') === null, 'demo ids must not enter the live past-order book');

assert(DEMO_SEED_ORDERS.length >= 3, 'seed demo orders required');
assert(findDemoSeedOrder('DEMO-2042')?.status === 'out_for_delivery', 'active demo order');
assert(findDemoSeedOrder('DEMO-1988')?.status === 'delivered', 'delivered demo order');
assert(findDemoSeedOrder('DEMO-1901')?.status === 'cancelled', 'cancelled demo order');

const active = filterOrders(DEMO_SEED_ORDERS, 'active');
assert(active.every((order) => order.status !== 'delivered' && order.status !== 'cancelled'), 'active filter');

const timeline = buildOrderTimeline(findDemoSeedOrder('DEMO-2042')!);
assert(timeline.length === 4, 'demo track timeline has four stages');
assert(timeline[2]?.state === 'current' || timeline[2]?.state === 'done', 'out for delivery mapped');

const bill = buildDemoCheckoutBill(
  [
    { product: { id: 'a', name: 'A', unit: '1', price: 100, image: 1 as never, images: [1 as never] }, quantity: 2 },
  ],
  10,
);
assert(bill.deliveryFee === DEMO_DELIVERY_FEE, 'demo delivery fee applied');
assert(bill.discount === 10, 'demo discount applied');
assert(bill.grandTotal === 200 + DEMO_DELIVERY_FEE - 10, 'demo grand total');

assert(previewCoupons.length > 0, 'demo coupons exist');
assert(DEMO_TRANSACTIONS.length > 0 && DEMO_NOTIFICATION_SEED.length > 0, 'demo inbox fixtures');
assert(DEMO_DELIVERY_FEE > 0, 'demo delivery fee configured');

const requiredHrefs = ['/transactions', '/notifications', '/settings', '/coupons', '/orders', '/my-payment', '/help', '/edit-profile', '/wishlist', '/addresses'];
for (const href of requiredHrefs) {
  assert(sideMenuItems.some((item) => item.href === href), `sidebar must route ${href}`);
}

console.log('demo frontend flow fixtures passed');
