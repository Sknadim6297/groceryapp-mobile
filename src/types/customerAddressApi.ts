/** Nested address block accepted by POST /api/values/UpdateAddress. */
export type RemoteAddressBlock = {
  Address: string;
  Country?: string;
  State?: string;
  City?: string;
  Pincode?: string;
};

/**
 * POST /api/values/UpdateAddress body.
 * Live validation requires PascalCase `Mobile` and at least one of HomeAddress / BillingAddress.
 */
export type UpdateAddressRequest = {
  Mobile: string;
  HomeAddress?: RemoteAddressBlock | string;
  BillingAddress?: RemoteAddressBlock | string;
};

export type RemoteAddressSlot = 'home' | 'billing';

export type ParsedRemoteAddress = {
  slot: RemoteAddressSlot;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
