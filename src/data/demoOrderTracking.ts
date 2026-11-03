import type { CustomerOrder, OrderStatus } from '@/types/order';
import type { DemoMapPoint, DemoOrderTracking, TrackTimelineStep } from '@/types/orderTracking';

/**
 * Fictional preview geometry for DEMO-2042.
 * Coordinates are local canvas units — not GPS, traffic, or live rider positions.
 */
const DEMO_2042_TRACKING: DemoOrderTracking = {
  orderId: 'DEMO-2042',
  mapSize: { width: 1000, height: 1000 },
  store: { x: 210, y: 720 },
  rider: { x: 455, y: 430 },
  delivery: { x: 760, y: 210 },
  route: [
    { x: 210, y: 720 },
    { x: 250, y: 640 },
    { x: 300, y: 580 },
    { x: 360, y: 520 },
    { x: 410, y: 470 },
    { x: 455, y: 430 },
    { x: 520, y: 370 },
    { x: 590, y: 310 },
    { x: 670, y: 255 },
    { x: 760, y: 210 },
  ],
  riderProgress: 0.52,
  etaMinutes: 35,
  etaRangeLabel: '35–40 min',
  statusChipLabel: 'On the way',
  paymentChipLabel: 'Demo paid',
  demoNotice: 'Demo Tracking — simulated map, not live GPS',
};

const TRACKING_BY_ORDER: Record<string, DemoOrderTracking> = {
  [DEMO_2042_TRACKING.orderId]: DEMO_2042_TRACKING,
};

/** Default preview geometry reused when a placed demo order has no dedicated map fixture. */
const FALLBACK_TRACKING: Omit<DemoOrderTracking, 'orderId'> = {
  mapSize: DEMO_2042_TRACKING.mapSize,
  store: DEMO_2042_TRACKING.store,
  rider: { x: 380, y: 500 },
  delivery: DEMO_2042_TRACKING.delivery,
  route: DEMO_2042_TRACKING.route,
  riderProgress: 0.35,
  etaMinutes: 40,
  etaRangeLabel: '40–50 min',
  statusChipLabel: 'On the way',
  paymentChipLabel: 'Demo paid',
  demoNotice: DEMO_2042_TRACKING.demoNotice,
};

export function getDemoOrderTracking(order: CustomerOrder): DemoOrderTracking | null {
  if (order.status === 'cancelled' || order.status === 'delivered') {
    return null;
  }
  const known = TRACKING_BY_ORDER[order.id];
  if (known) {
    return known;
  }
  return {
    orderId: order.id,
    ...FALLBACK_TRACKING,
    etaMinutes: Number.parseInt(order.eta?.value ?? '', 10) || FALLBACK_TRACKING.etaMinutes,
    etaRangeLabel: order.eta ? `${order.eta.value} ${order.eta.unit}` : FALLBACK_TRACKING.etaRangeLabel,
    statusChipLabel: statusChipFor(order.status),
  };
}

export function pointAlongRoute(route: readonly DemoMapPoint[], progress: number): DemoMapPoint {
  if (route.length === 0) {
    return { x: 0, y: 0 };
  }
  if (route.length === 1) {
    return route[0]!;
  }
  const clamped = Math.max(0, Math.min(1, progress));
  const scaled = clamped * (route.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(route.length - 1, index + 1);
  const t = scaled - index;
  const a = route[index]!;
  const b = route[next]!;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function splitRouteAtProgress(
  route: readonly DemoMapPoint[],
  progress: number,
): { completed: DemoMapPoint[]; remaining: DemoMapPoint[] } {
  if (route.length < 2) {
    return { completed: [...route], remaining: [...route] };
  }
  const rider = pointAlongRoute(route, progress);
  const scaled = Math.max(0, Math.min(1, progress)) * (route.length - 1);
  const index = Math.floor(scaled);
  const completed = [...route.slice(0, index + 1), rider];
  const remaining = [rider, ...route.slice(index + 1)];
  return { completed, remaining };
}

/**
 * Five-step track panel timeline. Timestamps come only from the order record.
 */
export function buildTrackPanelTimeline(order: CustomerOrder): TrackTimelineStep[] {
  if (order.status === 'cancelled') {
    return [];
  }
  const rank = trackRank(order.status);
  const stamps = order.statusAt;
  return [
    { id: 'placed', label: 'Order Placed', at: stamps?.placed ?? (order.placedAtLabel || undefined), state: stepState(0, rank) },
    { id: 'confirmed', label: 'Confirmed', at: stamps?.confirmed, state: stepState(1, rank) },
    { id: 'preparing', label: 'Preparing', at: stamps?.packing, state: stepState(2, rank) },
    {
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      at: stamps?.out_for_delivery ?? stamps?.picked_up,
      state: stepState(3, rank),
    },
    { id: 'delivered', label: 'Delivered', at: stamps?.delivered, state: stepState(4, rank) },
  ];
}

function trackRank(status: OrderStatus): number {
  switch (status) {
    case 'placed':
      return 0;
    case 'confirmed':
      return 1;
    case 'packing':
      return 2;
    case 'picked_up':
    case 'out_for_delivery':
      return 3;
    case 'delivered':
      return 4;
    default:
      return -1;
  }
}

function stepState(step: number, currentRank: number): TrackTimelineStep['state'] {
  if (currentRank < 0) {
    return 'pending';
  }
  if (step < currentRank) {
    return 'done';
  }
  if (step === currentRank) {
    return 'current';
  }
  return 'pending';
}

function statusChipFor(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Placed';
    case 'confirmed':
      return 'Confirmed';
    case 'packing':
      return 'Preparing';
    case 'picked_up':
      return 'Picked up';
    case 'out_for_delivery':
      return 'On the way';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Tracking';
  }
}
