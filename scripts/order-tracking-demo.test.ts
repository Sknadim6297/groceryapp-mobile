import { DEMO_SEED_ORDERS, findDemoSeedOrder } from '../src/data/demoOrders';
import {
  buildTrackPanelTimeline,
  getDemoOrderTracking,
  pointAlongRoute,
  splitRouteAtProgress,
} from '../src/data/demoOrderTracking';
import { isActiveOrder } from '../src/utils/orderListing';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const active = findDemoSeedOrder('DEMO-2042');
assert(active?.status === 'out_for_delivery', 'primary track order is out for delivery');
assert(active.partner?.name === 'Rohan Das', 'partner matches track fixture');
assert(active.addressTitle.includes('Mithakhali'), 'address synced with track UI');
assert(active.eta?.value === '35', 'ETA minutes synced');

const tracking = getDemoOrderTracking(active);
assert(tracking !== null, 'tracking geometry exists');
assert(tracking!.route.length >= 4, 'demo route has multiple points');
assert(tracking!.store.x !== tracking!.delivery.x, 'store and delivery differ');
assert(tracking!.demoNotice.toLowerCase().includes('demo'), 'demo notice required');

const rider = pointAlongRoute(tracking!.route, tracking!.riderProgress);
assert(Number.isFinite(rider.x) && Number.isFinite(rider.y), 'rider point computed');

const split = splitRouteAtProgress(tracking!.route, tracking!.riderProgress);
assert(split.completed.length >= 2 && split.remaining.length >= 2, 'route split into completed/remaining');

const timeline = buildTrackPanelTimeline(active);
assert(timeline.length === 5, 'five-step track timeline');
assert(timeline[3]?.state === 'current' || timeline[3]?.state === 'done', 'out for delivery marked');
assert(timeline[4]?.state === 'pending', 'delivered still pending');

const delivered = findDemoSeedOrder('DEMO-1988')!;
assert(getDemoOrderTracking(delivered) === null, 'delivered orders are not map-tracked');

assert(DEMO_SEED_ORDERS.some(isActiveOrder), 'active demo orders available for Track tab');

console.log('order tracking demo fixtures passed');
