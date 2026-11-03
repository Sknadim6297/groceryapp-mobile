import type { Href } from 'expo-router';

import type { AppIconName } from '@/components/ui/AppIcon';
import { profileRoutes } from '@/navigation/profileRoutes';

export type SideMenuItem = {
  label: string;
  icon: AppIconName;
  /** Existing app route. Omit for Coming Soon via `/menu`. */
  href?: Href;
};

/**
 * Left sidebar destinations only — visual drawer chrome stays in SideMenu.
 * Missing screens stay without href and open the existing Coming Soon placeholder.
 */
export const sideMenuItems: SideMenuItem[] = [
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
];

export function isSideMenuItemActive(item: SideMenuItem, pathname: string): boolean {
  if (!item.href || typeof item.href !== 'string') {
    return false;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
