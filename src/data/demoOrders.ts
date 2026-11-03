import type { SimulatedOrder } from '@/types/order';

/**
 * Fictional Mayapur Bazaar order fixtures for frontend demo only.
 * Never persisted to SecureStore customer books or sent to the C# API.
 */
export const DEMO_SEED_ORDERS: readonly SimulatedOrder[] = [
  {
    id: 'DEMO-2042',
    placedAtLabel: '03 Nov 2026',
    status: 'out_for_delivery',
    statusDetail: 'Your groceries are on the way',
    totalAmount: 645,
    total: 645,
    paymentLabel: 'Demo · Paid Online (preview)',
    statusAt: {
      placed: '03 Nov, 10:12 AM',
      confirmed: '03 Nov, 10:14 AM',
      packing: '03 Nov, 10:28 AM',
      picked_up: '03 Nov, 11:00 AM',
      out_for_delivery: '03 Nov, 11:05 AM',
    },
    eta: { value: '35', unit: 'min away' },
    addressTitle: 'A/234, Kigs Plaza, Mithakhali',
    addressLine: 'Ahmedabad - 380006',
    items: [
      { id: 'bananas', name: 'Fresh Bananas', quantity: 2, unit: '1 kg' },
      { id: 'tomatoes', name: 'Organic Tomatoes', quantity: 1, unit: '500 g' },
      { id: 'toned-milk', name: 'DairyCo Toned Milk', quantity: 2, unit: '1 L' },
      { id: 'eggs', name: 'FarmFresh Eggs', quantity: 1, unit: '12 pcs' },
      { id: 'carrots', name: 'Carrots', quantity: 1, unit: '500 g' },
    ],
    partner: {
      name: 'Rohan Das',
      status: 'Delivery Partner',
      ratingLabel: '4.8 (1,246)',
      phone: undefined,
    },
    offer: { title: 'Demo savings', detail: 'Preview discount only — not a live offer.' },
  },
  {
    id: 'DEMO-1988',
    placedAtLabel: '01 Nov 2026',
    status: 'delivered',
    statusDetail: 'Demo delivered order.',
    totalAmount: 412,
    total: 412,
    paymentLabel: 'Demo · UPI',
    statusAt: {
      placed: '01 Nov, 8:02 AM',
      confirmed: '01 Nov, 8:04 AM',
      packing: '01 Nov, 8:20 AM',
      out_for_delivery: '01 Nov, 8:55 AM',
      delivered: '01 Nov, 9:18 AM',
    },
    addressTitle: 'Office',
    addressLine: 'Gate 2, ISKCON Campus, Mayapur',
    items: [
      { id: 'basmati', name: 'Harvest Basmati Rice', quantity: 1, unit: '5 kg' },
      { id: 'cooking-oil', name: 'SunPure Cooking Oil', quantity: 1, unit: '1 L' },
    ],
  },
  {
    id: 'DEMO-1901',
    placedAtLabel: '28 Oct 2026',
    status: 'cancelled',
    statusDetail: 'Demo cancellation. No charge was made.',
    totalAmount: 156,
    total: 156,
    paymentLabel: 'Demo · Card',
    statusAt: {
      placed: '28 Oct, 7:40 PM',
      cancelled: '28 Oct, 7:52 PM',
    },
    addressTitle: 'Home',
    addressLine: '12 Tulsi Lane, Mayapur, Nadia 741313',
    items: [
      { id: 'apples', name: 'Fresh Apples', quantity: 1, unit: '1 kg' },
      { id: 'curd', name: 'Fresh Curd', quantity: 2, unit: '400 g' },
    ],
  },
  {
    id: 'DEMO-1875',
    placedAtLabel: '03 Nov 2026',
    status: 'packing',
    statusDetail: 'Demo preparing order.',
    totalAmount: 289,
    total: 289,
    paymentLabel: 'Demo · UPI',
    statusAt: {
      placed: '03 Nov, 12:01 PM',
      confirmed: '03 Nov, 12:03 PM',
      packing: '03 Nov, 12:10 PM',
    },
    addressTitle: 'Home',
    addressLine: '12 Tulsi Lane, Mayapur, Nadia 741313',
    items: [
      { id: 'potatoes', name: 'Premium Potatoes', quantity: 2, unit: '1 kg' },
      { id: 'top-onions', name: 'Onions', quantity: 1, unit: '1 kg' },
      { id: 'coriander', name: 'Coriander', quantity: 1, unit: '100 g' },
    ],
  },
];

export function findDemoSeedOrder(id: string): SimulatedOrder | null {
  return DEMO_SEED_ORDERS.find((order) => order.id === id) ?? null;
}
