export const orderStatuses = [
  "placed",
  "confirmed",
  "packing",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
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
  /** Demo-only rating caption, e.g. "4.8 (1,246)". Never a live rating feed. */
  ratingLabel?: string;
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
  /** Payable total in INR when the order API publishes it. Never invent this client-side. */
  totalAmount?: number;
  /**
   * Human-readable timestamps per status when the order API publishes them.
   * Missing keys stay blank on the My Orders timeline.
   */
  statusAt?: Partial<Record<OrderStatus, string>>;
  eta?: OrderEta;
  addressTitle: string;
  addressLine: string;
  items: OrderLine[];
  partner?: DeliveryPartner;
  offer?: OrderOffer;
};

export type ActiveOrderState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: CustomerOrder };

/**
 * Frontend demo / preview session order.
 * `total` and `paymentLabel` are UI-only fields and are never sent to a payment API.
 */
export type SimulatedOrder = CustomerOrder & {
  total: number;
  paymentLabel: string;
  /** Selected cancel-reason ids when the shopper cancels in preview. */
  cancelReasonIds?: string[];
  /** Preview-only return request captured from the return & refund modal. */
  returnRequested?: boolean;
  returnReasonIds?: string[];
  /** Catalogue line ids included in the return request. */
  returnItemIds?: string[];
  /** Local photo URIs attached as return evidence (preview only — never uploaded to a bank). */
  returnPhotoUris?: string[];
};
