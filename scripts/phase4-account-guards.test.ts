/**
 * Phase 4 regression: profile isolation, settings persistence, logout scoping,
 * preview/live order guards, coupon/notification clears, demo action honesty.
 * Run: npx --yes tsx scripts/phase4-account-guards.test.ts
 */

import {
  DEFAULT_APP_SETTINGS,
  installAppSettingsStoreForTests,
  loadAppSettings,
  saveAppSettings,
} from '../src/services/appSettingsStore';
import {
  clearCollectedCouponIds,
  installCouponCollectionStoreForTests,
  loadCollectedCouponIds,
  saveCollectedCouponIds,
} from '../src/services/couponCollectionStore';
import {
  buildCustomerProfile,
  installCustomerProfileStoreForTests,
  loadCustomerProfile,
  profileOwnerKey,
  saveCustomerProfile,
} from '../src/services/customerProfileStore';
import {
  clearNotificationInboxStorage,
  installNotificationInboxStoreForTests,
  loadNotificationInbox,
  markNotificationRead,
  saveNotificationInbox,
} from '../src/services/notificationInboxStore';
import { UI_PREVIEW_MODE } from '../src/constants/preview';
import { findPastOrder, readPastOrders } from '../src/data/pastOrders';
import { readActiveOrder } from '../src/data/activeOrder';
import { clearPreviewAccountState } from '../src/utils/clearPreviewAccountState';
import { clearSignedInSession } from '../src/utils/customerSession';
import {
  DEMO_ORDER_CANCEL_TOAST,
  DEMO_ORDER_RETURN_NOTE,
  DEMO_ORDER_RETURN_TOAST,
} from '../src/utils/demoOrderActions';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  // --- Profile owner isolation ---
  installCustomerProfileStoreForTests(null);
  const ownerA = profileOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' });
  const ownerB = profileOwnerKey({ kind: 'temporary-ui', mobile: '9000000002' });
  assert(ownerA === 'temporary-ui:9000000001', 'owner A key');
  assert(ownerB === 'temporary-ui:9000000002', 'owner B key');

  const memory = new Map<string, string>();
  installCustomerProfileStoreForTests({
    async read() {
      return memory.get('groceryapp.customer-profiles') ?? null;
    },
    async write(value) {
      memory.set('groceryapp.customer-profiles', value);
    },
    async remove() {
      memory.delete('groceryapp.customer-profiles');
    },
  });

  const profileA = buildCustomerProfile(ownerA!, '9000000001', {
    name: 'Asha Verma',
    email: 'asha@example.com',
    dateOfBirth: '1994-05-12',
  });
  const profileB = buildCustomerProfile(ownerB!, '9000000002', {
    name: 'Bikash Das',
    email: '',
    dateOfBirth: '',
  });
  assert(profileA != null && profileB != null, 'profiles build');
  assert(await saveCustomerProfile(profileA!), 'save A');
  assert(await saveCustomerProfile(profileB!), 'save B');
  assert((await loadCustomerProfile(ownerA!))?.name === 'Asha Verma', 'A isolated');
  assert((await loadCustomerProfile(ownerB!))?.name === 'Bikash Das', 'B isolated');
  assert(
    buildCustomerProfile(ownerA!, '9000000001', { name: 'X', email: 'bad', dateOfBirth: '' }) == null,
    'invalid email rejected',
  );

  // --- Settings persistence (survives logout by design) ---
  installAppSettingsStoreForTests(null);
  assert(await saveAppSettings({ orderAlerts: false, offerAlerts: true }), 'save prefs');
  assert((await loadAppSettings()).orderAlerts === false, 'orderAlerts persist');
  assert((await loadAppSettings()).offerAlerts === true, 'offerAlerts persist');

  // --- Logout clears account-scoped hooks; settings stay ---
  const calls: string[] = [];
  clearSignedInSession({
    clearAuthSession: () => calls.push('auth'),
    clearAccount: () => calls.push('account'),
    clearRememberedCustomer: () => calls.push('remembered'),
    setNationalNumber: (value) => calls.push(`phone:${value}`),
    clearDraft: () => calls.push('draft'),
    clearDelivery: () => calls.push('delivery'),
    clearDevTestSession: () => calls.push('dev'),
    clearSavedAddresses: () => calls.push('addresses'),
    clearCustomerProfile: () => calls.push('profile'),
    clearPreviewAccountState: () => calls.push('preview'),
  });
  assert(
    calls.join('|') ===
      'auth|account|remembered|phone:|draft|delivery|dev|addresses|profile|preview',
    'logout clears session + preview account state hooks',
  );
  assert((await loadAppSettings()).offerAlerts === true, 'logout must keep device settings');
  assert(DEFAULT_APP_SETTINGS.orderAlerts === true, 'defaults unchanged');

  // --- Preview coupon + notification cleared on shared-device logout helper ---
  installCouponCollectionStoreForTests(null);
  installNotificationInboxStoreForTests(null);
  assert(await saveCollectedCouponIds(['demo-save10', 'demo-free-delivery']), 'collect coupons');
  await saveNotificationInbox({ cleared: false, readIds: ['n1'] });
  await markNotificationRead('n2');
  assert((await loadCollectedCouponIds()).length === 2, 'coupons collected');
  assert((await loadNotificationInbox()).readIds.includes('n1'), 'inbox has reads');

  await clearPreviewAccountState();
  assert((await loadCollectedCouponIds()).length === 0, 'logout clears collected coupons');
  assert((await loadNotificationInbox()).readIds.length === 0, 'logout clears inbox overrides');
  assert((await loadNotificationInbox()).cleared === false, 'inbox storage removed to defaults');

  await clearCollectedCouponIds();
  await clearNotificationInboxStorage();

  // --- Live order / tracking guards (no invented live data) ---
  assert(readPastOrders().kind === 'empty', 'live past orders empty');
  assert(findPastOrder('FAKE-ORDER') === null, 'no invented order ids');
  assert(readActiveOrder().kind === 'empty', 'live active order empty');
  // UI_PREVIEW_MODE is env-driven; either value is fine as long as live catalogs stay empty.
  assert(typeof UI_PREVIEW_MODE === 'boolean', 'preview flag is boolean');

  // --- Demo action honesty ---
  assert(DEMO_ORDER_CANCEL_TOAST.toLowerCase().includes('demo'), 'cancel toast labeled demo');
  assert(!DEMO_ORDER_CANCEL_TOAST.toLowerCase().includes('thanks for the feedback'), 'no fake cancel success');
  assert(DEMO_ORDER_RETURN_TOAST.toLowerCase().includes('demo'), 'return toast labeled demo');
  assert(DEMO_ORDER_RETURN_NOTE.toLowerCase().includes('demo'), 'return note labeled demo');
  assert(!DEMO_ORDER_RETURN_TOAST.toLowerCase().includes('submitted with product photos'), 'no fake refund claim');

  // eslint-disable-next-line no-console
  console.log('phase4-account-guards fixtures passed');
}

void main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
