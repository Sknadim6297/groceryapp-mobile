import type { OrderStatus } from '@/types/order';

/** Unitless demo map coordinates — not GPS. */
export type DemoMapPoint = {
  x: number;
  y: number;
};

/**
 * Frontend-only tracking geometry for a demo order.
 * Never treat as live navigation or device location.
 */
export type DemoOrderTracking = {
  orderId: string;
  /** Map canvas size in local units. */
  mapSize: { width: number; height: number };
  store: DemoMapPoint;
  rider: DemoMapPoint;
  delivery: DemoMapPoint;
  /** Ordered polyline from store → delivery. Rider sits on this path. */
  route: readonly DemoMapPoint[];
  /** 0–1 progress along `route` for the rider marker. */
  riderProgress: number;
  etaMinutes: number;
  etaRangeLabel: string;
  statusChipLabel: string;
  paymentChipLabel: string;
  demoNotice: string;
};

export type TrackTimelineStepId =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered';

export type TrackTimelineStep = {
  id: TrackTimelineStepId;
  label: string;
  at?: string;
  state: 'done' | 'current' | 'pending';
};

export type TrackableOrderStatus = Exclude<OrderStatus, 'cancelled'>;
