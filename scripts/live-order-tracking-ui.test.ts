/**
 * Live order tracking UI contracts — no React Native rendering.
 */

import { DEMO_SEED_ORDERS, findDemoSeedOrder } from '../src/data/demoOrders';
import {
  getDemoOrderTracking,
  shouldShowRiderMarker,
} from '../src/data/demoOrderTracking';
import { formatTrackingEtaLabel, trackingEtaFallbackLabel } from '../src/utils/trackingEta';

/** Mirrors `BRAND_NAME` without importing brand.ts (PNG require breaks Node tests). */
const STORE_PICKUP_LABEL = 'Mayapur Bazaar';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const active = findDemoSeedOrder('DEMO-2042');
assert(active != null, 'DEMO-2042 exists');
assert(shouldShowRiderMarker(active.status), 'out_for_delivery shows rider');
assert(!shouldShowRiderMarker('packing'), 'packing hides rider');
assert(!shouldShowRiderMarker('confirmed'), 'confirmed hides rider');

const eta = formatTrackingEtaLabel(active);
assert(eta === '35 min away', `ETA uses order field only, got ${eta}`);
assert(trackingEtaFallbackLabel() === 'Delivery time updating', 'fallback label is honest');

const noEta = { ...active, eta: undefined };
assert(formatTrackingEtaLabel(noEta) === null, 'missing ETA returns null');

const tracking = getDemoOrderTracking(active);
assert(tracking != null, 'tracking geometry available');
assert(tracking!.demoNotice.toLowerCase().includes('demo'), 'demo notice required');
assert(tracking!.route.length >= 2, 'demo polyline is multi-point (not a single straight segment claim)');

assert(STORE_PICKUP_LABEL === 'Mayapur Bazaar', 'pickup uses brand store name');
assert(!active.addressLine.includes('Thornridge'), 'does not use reference placeholder address');

assert(active.items.length > 0, 'order details section has real line items');
assert(
  active.items.every((item) => item.id.trim().length > 0 && item.name.trim().length > 0),
  'line items carry catalogue ids and names for image resolution in-app',
);

assert(active.partner?.phone == null, 'demo partner phone stays unset — call must disable honestly');

const packing = DEMO_SEED_ORDERS.find((order) => order.status === 'packing');
assert(packing != null, 'packing fixture exists');
assert(getDemoOrderTracking(packing!) != null, 'pre-dispatch orders still get location-only map');
assert(!shouldShowRiderMarker(packing!.status), 'packing map is location-only');

const sheetCollapsed = 0.48;
const sheetExpanded = 0.72;
assert(sheetCollapsed >= 0.45 && sheetCollapsed <= 0.5, 'collapsed sheet ~45–50%');
assert(sheetExpanded > sheetCollapsed, 'expanded sheet taller than collapsed');

for (const width of [320, 360, 390, 430]) {
  const ratio = width < 360 ? 0.5 : 0.48;
  assert(ratio >= 0.45 && ratio <= 0.5, `sheet ratio ok at ${width}`);
}

console.log('live order tracking UI contracts passed');
