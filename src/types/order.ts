export const orderStatuses = [
  'placed',
  'confirmed',
  'packing',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
};

export type DeliveryPartner = {
  name: string;
  status: string;
  phone?: string;
};

export type OrderOffer = {
  title: string;
  detail: string;
};

export type OrderEta = {
  value: string;
  unit: string;
};

/** A placed order from a real order source. Fields are omitted when that source has not provided them. */
export type CustomerOrder = {
  id: string;
  placedAtLabel: string;
  status: OrderStatus;
  statusDetail?: string;
  eta?: OrderEta;
  addressTitle: string;
  addressLine: string;
  items: OrderLine[];
  partner?: DeliveryPartner;
  offer?: OrderOffer;
};

export type ActiveOrderState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; order: CustomerOrder };
