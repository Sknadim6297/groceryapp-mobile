/**
 * Central entry for frontend demo fixtures.
 * Swap these modules for C# catalogue/order APIs later without touching auth.
 */
export { DEMO_SEED_ORDERS, findDemoSeedOrder } from '@/data/demoOrders';
export { DEMO_TRANSACTIONS } from '@/data/demoTransactions';
export { DEMO_NOTIFICATIONS } from '@/data/demoNotifications';
export { DEMO_STORES, findDemoStore } from '@/data/demoStores';
export { previewCoupons, previewCouponById } from '@/data/previewCoupons';
export { DEMO_DELIVERY_FEE } from '@/utils/demoCheckoutBill';
