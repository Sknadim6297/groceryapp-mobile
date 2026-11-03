import { findPastOrder, readPastOrders } from '../src/data/pastOrders';
import { profileRoutes } from '../src/navigation/profileRoutes';
import type { RegisteredCustomer } from '../src/types/customerApi';
import { clearSignedInSession } from '../src/utils/customerSession';
import { registeredDisplayName, registeredDisplayPhone } from '../src/utils/registeredIdentity';

const orders = readPastOrders();
if (orders.kind !== 'empty') {
  throw new Error('past orders must stay empty until an order API exists');
}
if (findPastOrder('order-1') !== null) {
  throw new Error('findPastOrder must not invent an order');
}

const account: RegisteredCustomer = {
  customerId: 'customer-1',
  name: 'Registered Customer',
  mobile: '9000000001',
  companyMobile: null,
};

if (registeredDisplayName(account) !== 'Registered Customer') {
  throw new Error('the displayed name must come from the registered account');
}
if (registeredDisplayPhone(account) !== '+91 90000 00001') {
  throw new Error('the displayed mobile must come from the registered account');
}
if (registeredDisplayName(null) !== 'Your account' || registeredDisplayPhone(null) !== 'No phone number yet') {
  throw new Error('a signed-out menu must not keep a draft name or login number');
}

if (
  profileRoutes.tab !== 'profile' ||
  profileRoutes.profile !== '/profile' ||
  profileRoutes.login !== '/login' ||
  profileRoutes.account !== '/edit-profile' ||
  profileRoutes.completeProfile !== '/complete-profile' ||
  profileRoutes.addresses !== '/addresses' ||
  profileRoutes.wishlist !== '/wishlist' ||
  profileRoutes.help !== '/help'
) {
  throw new Error('profile navigation must keep one route for the tab, menu, and avatar');
}

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
});

const expected = ['auth', 'account', 'remembered', 'phone:', 'draft', 'delivery', 'dev', 'addresses', 'profile'];
if (calls.join('|') !== expected.join('|')) {
  throw new Error('logout must clear customer session state including the active profile book');
}

console.log('profile navigation fixtures passed');
