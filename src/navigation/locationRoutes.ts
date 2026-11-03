import type { Href } from 'expo-router';

/** Shared routes for the global delivery location system. */
export const locationRoutes = {
  search: '/location' as Href,
  map: '/location-map' as Href,
  manual: '/location-manual' as Href,
  addresses: '/addresses' as Href,
  addressForm: '/address-form' as Href,
};

export function addressesSelectHref(): Href {
  return { pathname: '/addresses', params: { mode: 'select' } };
}

export function addressFormSelectHref(): Href {
  return { pathname: '/address-form', params: { mode: 'select' } };
}
