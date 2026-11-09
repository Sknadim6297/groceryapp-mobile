/**
 * GET /api/values/products requires a company id and does not publish a response sample.
 * Local fixtures must not be shown as live prices, stock, or offers.
 *
 * Set EXPO_PUBLIC_PRODUCTS_COMPANY to the real company query value from your backend.
 * Until that value is set, the app keeps the local catalogue and does not call products.
 */
export const PRODUCTS_COMPANY = (process.env.EXPO_PUBLIC_PRODUCTS_COMPANY ?? '').trim();

export const LIVE_CATALOGUE_CONNECTED = PRODUCTS_COMPANY.length > 0;
