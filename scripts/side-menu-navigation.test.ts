import { profileRoutes } from '../src/navigation/profileRoutes';
import { isSideMenuItemActive, sideMenuItems } from '../src/navigation/sideMenuItems';

const expected = [
  { label: 'My Profile', icon: 'profile', href: profileRoutes.account },
  { label: 'My Orders', icon: 'bag', href: '/orders' },
  { label: 'My Payment', icon: 'card', href: '/my-payment' },
  { label: 'My Favourite', icon: 'heart', href: profileRoutes.wishlist },
  { label: 'Transactions', icon: 'history', href: '/transactions' },
  { label: 'Promocode', icon: 'tag', href: '/coupons' },
  { label: 'My Address', icon: 'stores', href: profileRoutes.addresses },
  { label: 'Notification', icon: 'bell', href: '/notifications' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
  { label: 'Support Center', icon: 'headset', href: profileRoutes.help },
] as const;

if (sideMenuItems.length !== expected.length) {
  throw new Error(`sidebar must list exactly ${expected.length} items`);
}

for (let index = 0; index < expected.length; index += 1) {
  const item = sideMenuItems[index];
  const want = expected[index];
  if (!item || !want) {
    throw new Error(`missing sidebar item at index ${index}`);
  }
  if (item.label !== want.label || item.icon !== want.icon || item.href !== want.href) {
    throw new Error(`sidebar item mismatch at ${want.label}`);
  }
}

const labels = sideMenuItems.map((item) => item.label);
if (new Set(labels).size !== labels.length) {
  throw new Error('sidebar must not contain duplicate labels');
}

if (!isSideMenuItemActive(sideMenuItems[0]!, '/edit-profile')) {
  throw new Error('My Profile should highlight on /edit-profile');
}

console.log('side menu navigation fixtures passed');
