import type { DeliveryLocation } from '@/types/location';

/** Addresses shown on the location screen. They are not loaded from an account. */
export const referenceLocations: readonly DeliveryLocation[] = [
  {
    id: 'home',
    label: 'Home',
    addressLine1: 'H.No. 2834, Street 784, Sector',
    city: 'Lucknow',
    source: 'saved',
  },
  {
    id: 'work',
    label: 'Work',
    addressLine1: 'Cyber Tower, Vibhuti Khand',
    city: 'Lucknow',
    source: 'saved',
  },
  {
    id: 'charbagh',
    label: 'Charbagh',
    addressLine1: 'Charbagh',
    city: 'Lucknow',
    source: 'saved',
  },
];

export function formatDeliveryAddress(location: DeliveryLocation): string {
  return [location.addressLine1, location.landmark, location.city, location.state, location.postalCode]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');
}
