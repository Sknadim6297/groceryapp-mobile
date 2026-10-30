export type LocationSource = 'gps' | 'manual' | 'saved';

export type DeliveryLocation = {
  id: string;
  label: string;
  addressLine1: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  source: LocationSource;
  approximate?: boolean;
};

export type ManualAddressInput = {
  addressLine1: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
};
