export type LocationSource = "gps" | "manual" | "saved" | "search" | "map";
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
  accuracyMeters?: number;
  fixAgeMs?: number;
  fixKind?:
    | "watched-gps"
    | "fresh-gps"
    | "last-known"
    | "network-or-coarse"
    | "map-pin"
    | "search"
    | "manual"
    | "saved";
  fixNote?: string;
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
