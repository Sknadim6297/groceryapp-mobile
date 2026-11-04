import { profileRoutes } from '../src/navigation/profileRoutes';
import { isSideMenuItemActive, sideMenuItems } from '../src/navigation/sideMenuItems';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredLabels = [
  'My Profile',
  'My Orders',
  'My Favourite',
  'Promocode',
  'Returns & Refunds',
  'Manage Address',
  'Payment Methods',
  'Wallet',
  'Invite Friends',
  'Transactions',
  'Notification',
  'Settings',
  'Complain',
  'Help Center',
  'Privacy Policy',
  'FAQ',
  'Logout',
] as const;

for (const label of requiredLabels) {
  assert(
    sideMenuItems.some((item) => item.label === label),
    `sidebar must include ${label}`,
  );
}

assert(sideMenuItems.find((item) => item.label === 'My Profile')?.href === profileRoutes.account, 'My Profile route');
assert(sideMenuItems.find((item) => item.label === 'Manage Address')?.href === profileRoutes.addresses, 'Manage Address route');
assert(sideMenuItems.find((item) => item.label === 'Payment Methods')?.href === profileRoutes.myPayment, 'Payment Methods route');
assert(sideMenuItems.find((item) => item.label === 'Help Center')?.href === profileRoutes.help, 'Help Center route');
assert(sideMenuItems.find((item) => item.label === 'Privacy Policy')?.href === '/privacy', 'Privacy Policy route');
assert(sideMenuItems.find((item) => item.label === 'Logout')?.action === 'logout', 'Logout action');

const labels = sideMenuItems.map((item) => item.label);
assert(new Set(labels).size === labels.length, 'sidebar must not contain duplicate labels');

const profile = sideMenuItems.find((item) => item.label === 'My Profile');
assert(profile != null && isSideMenuItemActive(profile, '/edit-profile'), 'My Profile should highlight on /edit-profile');

console.log('side menu navigation fixtures passed');
