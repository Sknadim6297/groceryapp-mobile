/**
 * Pure helpers for offline UI. Being connected never guarantees API availability.
 */

export function shouldShowOfflineBanner(input: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  return input.isConnected === false || input.isInternetReachable === false;
}

export const OFFLINE_BANNER_COPY =
  'Showing saved catalogue and cart on this device when available. Connecting does not guarantee the store API is reachable — retry after you are back online.';

export const CATALOGUE_NETWORK_ERROR_HINT =
  'Unable to load the store catalogue. Check your connection and try again — being online does not always mean the API is reachable.';
