import { findPastOrder, readPastOrders } from '../src/data/pastOrders';
import type { CustomerOrder } from '../src/types/order';
import {
  buildOrderTimeline,
  filterOrders,
  isActiveOrder,
  orderItemCount,
  orderStatusLabel,
} from '../src/utils/orderListing';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const sample: CustomerOrder[] = [
  {
    id: 'MB-1',
    placedAtLabel: '03 Nov 2026',
    status: 'packing',
    addressTitle: '',
    addressLine: '',
    items: [
      { id: 'a', name: 'Milk', quantity: 2 },
      { id: 'b', name: 'Bread', quantity: 1 },
    ],
    totalAmount: 180,
    statusAt: { placed: '03 Nov, 10:00 AM', confirmed: '03 Nov, 10:05 AM' },
  },
  {
    id: 'MB-2',
    placedAtLabel: '01 Nov 2026',
    status: 'delivered',
    addressTitle: '',
    addressLine: '',
    items: [{ id: 'c', name: 'Rice', quantity: 1 }],
    statusAt: { delivered: '01 Nov, 6:00 PM' },
  },
  {
    id: 'MB-3',
    placedAtLabel: '02 Nov 2026',
    status: 'cancelled',
    addressTitle: '',
    addressLine: '',
    items: [],
    statusAt: { cancelled: '02 Nov, 11:00 AM' },
  },
];

// Live catalogue must stay empty until an orders API exists.
const live = readPastOrders();
assert(live.kind === 'empty', 'past orders must stay empty until an order API exists');
assert(findPastOrder('MB-1') === null, 'findPastOrder must not invent an order');

assert(filterOrders(sample, 'all').length === 3, 'all filter');
assert(filterOrders(sample, 'active').map((o) => o.id).join(',') === 'MB-1', 'active filter');
assert(filterOrders(sample, 'delivered').map((o) => o.id).join(',') === 'MB-2', 'delivered filter');
assert(isActiveOrder(sample[0]!) && !isActiveOrder(sample[1]!) && !isActiveOrder(sample[2]!), 'active helper');

assert(orderItemCount(sample[0]!) === 3, 'item count sums quantities');
assert(orderItemCount(sample[2]!) === 0, 'empty items count is zero');
assert(orderStatusLabel.packing === 'Preparing', 'packing label');

const packingTimeline = buildOrderTimeline(sample[0]!);
assert(packingTimeline.length === 4, 'active timeline has four stages');
assert(packingTimeline[0]?.state === 'done' && packingTimeline[1]?.state === 'current', 'packing maps to confirmed stage');
assert(packingTimeline[2]?.state === 'pending' && packingTimeline[3]?.state === 'pending', 'later stages stay pending');
assert(packingTimeline[0]?.at === '03 Nov, 10:00 AM', 'uses provided statusAt when present');
assert(packingTimeline[2]?.at === undefined, 'does not invent missing timestamps');

const deliveredTimeline = buildOrderTimeline(sample[1]!);
assert(deliveredTimeline.every((step) => step.state === 'done' || step.id !== 'delivered' || step.state === 'current'), 'delivered progresses');
assert(deliveredTimeline[3]?.state === 'current' || deliveredTimeline[3]?.state === 'done', 'delivered is current/done');
assert(deliveredTimeline[3]?.at === '01 Nov, 6:00 PM', 'delivered timestamp when provided');

const cancelledTimeline = buildOrderTimeline(sample[2]!);
assert(cancelledTimeline.length === 2, 'cancelled timeline is short');
assert(cancelledTimeline[1]?.state === 'cancelled', 'cancelled marker');
assert(cancelledTimeline[1]?.label === 'Order Cancelled', 'cancelled label');

// Missing timestamps fall back only for placed label — never invent other stages.
const bare: CustomerOrder = {
  id: 'bare',
  placedAtLabel: 'Placed recently',
  status: 'placed',
  addressTitle: '',
  addressLine: '',
  items: [],
};
const bareTimeline = buildOrderTimeline(bare);
assert(bareTimeline[0]?.at === 'Placed recently', 'placedAtLabel used when statusAt missing');
assert(!bareTimeline[1]?.at && !bareTimeline[2]?.at && !bareTimeline[3]?.at, 'no invented later stamps');

console.log('orders listing rules passed');
