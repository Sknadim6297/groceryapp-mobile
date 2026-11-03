export type LocationSource = 'gps' | 'manual' | 'saved' | 'search' | 'map';

/**
 * Map-selected / GPS / search delivery point.
 * Not the same as a complete SavedAddress (house/flat details may still be missing).
 */
export type DeliveryLocation = {
  id: string;
  label: string;
  addressLine1: string;
  landmark?: string;
  /** Area / locality when known. */
  locality?: string;
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

/** Search hit shown on Select Delivery Location. */
export type LocationSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  location: DeliveryLocation;
};
