import { formatDeliveryAddress } from '@/data/referenceLocations';
import type { DeliveryLocation } from '@/types/location';
import type { SavedAddress } from '@/types/savedAddress';

/** Address block shared by POST register and POST update. */
export type CustomerAddressFields = {
  Address: string;
  Country?: string;
  State?: string;
  City?: string;
  Pincode?: string;
};

/**
 * Maps a delivery location onto the help-page Address / Country / State / City / Pincode fields.
 * Returns null when there is no usable street line.
 */
export function addressFieldsFromDeliveryLocation(
  location: DeliveryLocation | null | undefined,
): CustomerAddressFields | null {
  if (!location) {
    return null;
  }
  const address = formatDeliveryAddress(location).trim();
  if (address.length === 0) {
    return null;
  }
  const fields: CustomerAddressFields = { Address: address };
  const country = location.country?.trim();
  const state = location.state?.trim();
  const city = location.city?.trim();
  const pincode = location.postalCode?.trim();
  if (country) {
    fields.Country = country;
  }
  if (state) {
    fields.State = state;
  }
  if (city) {
    fields.City = city;
  }
  if (pincode) {
    fields.Pincode = pincode;
  }
  return fields;
}

/** Maps a saved address book entry onto the same help-page address fields. */
export function addressFieldsFromSavedAddress(address: SavedAddress): CustomerAddressFields {
  const line = [
    address.addressLine1,
    address.area && address.area !== address.addressLine1 ? address.area : null,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');
  const fields: CustomerAddressFields = { Address: line };
  if (address.country.trim()) {
    fields.Country = address.country.trim();
  }
  if (address.state.trim()) {
    fields.State = address.state.trim();
  }
  if (address.city.trim()) {
    fields.City = address.city.trim();
  }
  if (address.postalCode.trim()) {
    fields.Pincode = address.postalCode.trim();
  }
  return fields;
}
