import type { LocationSource } from '@/types/location';

export type AddressLabel = 'Home' | 'Work' | 'Other';

export type SavedAddress = {
  id: string;
  label: AddressLabel;
  /** Used when label is Other. */
  customLabel?: string;
  /** House / flat number when captured separately. */
  houseNumber?: string;
  /** Building / street when captured separately. */
  buildingStreet?: string;
  /** Area / locality. */
  area?: string;
  /** Composed street line used for display and registration Address field. */
  addressLine1: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
  source: LocationSource;
  isDefault: boolean;
  updatedAt: number;
};

export type SavedAddressDraft = {
  label: AddressLabel;
  customLabel: string;
  houseNumber: string;
  buildingStreet: string;
  area: string;
  addressLine1: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  instructions: string;
  latitude?: number;
  longitude?: number;
  source: LocationSource;
};

export type SavedAddressBook = {
  ownerKey: string;
  addresses: SavedAddress[];
};
