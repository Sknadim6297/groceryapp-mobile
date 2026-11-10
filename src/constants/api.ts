const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const LIVE_API_BASE_URL = (
  configured && configured.length > 0 ? configured : 'https://api.supertrading.online'
).replace(/\/+$/, '');


export const API_BASE_URL = LIVE_API_BASE_URL;

export const CUSTOMER_API = {
  register: '/api/values/customer/register',
  update: '/api/values/customer/update',
  sendOtp: '/api/values/customer/send-otp',
  resendOtp: '/api/values/customer/resend-otp',
  verifyOtp: '/api/values/customer/verify-otp',
} as const;

/**
 * Split catalogue endpoints (preferred over the old monolithic products payload).
 * - products: list + primary Image1
 * - categories / subcategories: taxonomy
 * - productimages: Image2–Image4 for a ProductId
 */
export const PRODUCTS_API = {
  list: '/api/values/products',
} as const;

export const CATEGORIES_API = {
  list: '/api/values/categories',
} as const;

export const SUBCATEGORIES_API = {
  list: '/api/values/subcategories',
} as const;

export const PRODUCT_IMAGES_API = {
  list: '/api/values/productimages',
} as const;

/**
 * Address book endpoints from the ASP.NET Help page.
 * Samples are unpublished — request/response shapes are inferred from live validation messages.
 */
export const ADDRESS_API = {
  details: '/api/values/AddressDetails',
  update: '/api/values/UpdateAddress',
} as const;
