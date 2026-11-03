import type { CustomerOrder, OrderStatus } from '@/types/order';

export type OrdersFilterId = 'all' | 'active' | 'delivered';

export type OrderTimelineStepId = 'placed' | 'confirmed' | 'shipped' | 'delivered';

export type OrderTimelineStep = {
  id: OrderTimelineStepId;
  label: string;
  /** Timestamp label only when the order record provides one — never invented. */
  at?: string;
  state: 'done' | 'current' | 'pending' | 'cancelled';
};

const ACTIVE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'placed',
  'confirmed',
  'packing',
  'picked_up',
  'out_for_delivery',
]);

/** Display labels for collapsed card status chips. */
export const orderStatusLabel: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packing: 'Preparing',
  picked_up: 'Picked up',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function isActiveOrder(order: CustomerOrder): boolean {
  return ACTIVE_STATUSES.has(order.status);
}

export function filterOrders(orders: readonly CustomerOrder[], filter: OrdersFilterId): CustomerOrder[] {
  switch (filter) {
    case 'active':
      return orders.filter(isActiveOrder);
    case 'delivered':
      return orders.filter((order) => order.status === 'delivered');
    case 'all':
    default:
      return [...orders];
  }
}

export function orderItemCount(order: CustomerOrder): number {
  return order.items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
}

/**
 * Maps backend status onto the four reference timeline stages.
 * Completed markers follow status progression only — timestamps stay empty unless provided.
 */
export function buildOrderTimeline(order: CustomerOrder): OrderTimelineStep[] {
  if (order.status === 'cancelled') {
    return [
      {
        id: 'placed',
        label: 'Order Placed',
        at: order.placedAtLabel || undefined,
        state: 'done',
      },
      {
        id: 'confirmed',
        label: 'Order Cancelled',
        at: order.statusAt?.cancelled,
        state: 'cancelled',
      },
    ];
  }

  const rank = timelineRank(order.status);
  const stamps = order.statusAt;

  return [
    {
      id: 'placed',
      label: 'Order Placed',
      at: stamps?.placed ?? (order.placedAtLabel || undefined),
      state: stepState(0, rank),
    },
    {
      id: 'confirmed',
      label: 'Order Confirmed',
      at: stamps?.confirmed,
      state: stepState(1, rank),
    },
    {
      id: 'shipped',
      label: 'Out for Delivery',
      at: stamps?.out_for_delivery ?? stamps?.picked_up,
      state: stepState(2, rank),
    },
    {
      id: 'delivered',
      label: 'Order Delivered',
      at: stamps?.delivered,
      state: stepState(3, rank),
    },
  ];
}

function timelineRank(status: OrderStatus): number {
  switch (status) {
    case 'placed':
      return 0;
    case 'confirmed':
    case 'packing':
      return 1;
    case 'picked_up':
    case 'out_for_delivery':
      return 2;
    case 'delivered':
      return 3;
    default:
      return -1;
  }
}

function stepState(step: number, currentRank: number): OrderTimelineStep['state'] {
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

export function statusDotColor(status: OrderStatus): string {
  if (status === 'delivered') {
    return '#16A34A';
  }
  if (status === 'cancelled') {
    return '#DC2626';
  }
  return '#FACC15';
}
