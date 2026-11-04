import type { Href } from 'expo-router';

import type { AppIconName } from '@/components/ui/AppIcon';
import { accountRoutes } from '@/navigation/accountRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';

export type SideMenuItem = {
  label: string;
  icon: AppIconName;
  /** Existing app route. Omit for Coming Soon via `/menu`. */
  href?: Href;
  /** Special drawer actions that are not normal routes. */
  action?: 'logout';
};

/**
 * Left sidebar destinations only — visual drawer chrome stays in SideMenu.
 * Missing screens stay without href and open the existing Coming Soon placeholder.
 */
export const sideMenuItems: SideMenuItem[] = [
  { label: 'My Profile', icon: 'profile', href: profileRoutes.account },
  { label: 'My Orders', icon: 'bag', href: '/orders' },
  { label: 'My Favourite', icon: 'heart', href: profileRoutes.wishlist },
  { label: 'Promocode', icon: 'ticket', href: '/coupons' },
  { label: 'Returns & Refunds', icon: 'returns', href: accountRoutes.returns },
  { label: 'Manage Address', icon: 'stores', href: profileRoutes.addresses },
  { label: 'Payment Methods', icon: 'card', href: profileRoutes.myPayment },
  { label: 'Wallet', icon: 'wallet', href: accountRoutes.wallet },
  { label: 'Invite Friends', icon: 'users', href: accountRoutes.invite },
  { label: 'Transactions', icon: 'history', href: accountRoutes.transactions },
  { label: 'Notification', icon: 'bell', href: '/notifications' },
  { label: 'Settings', icon: 'settings', href: accountRoutes.settings },
  { label: 'Complain', icon: 'chat', href: accountRoutes.complaints },
  { label: 'Help Center', icon: 'headset', href: profileRoutes.help },
  { label: 'Privacy Policy', icon: 'shield', href: '/privacy' },
  { label: 'FAQ', icon: 'help', href: profileRoutes.help },
  { label: 'Logout', icon: 'logout', action: 'logout' },
];

export function isSideMenuItemActive(item: SideMenuItem, pathname: string): boolean {
  if (!item.href || typeof item.href !== 'string') {
    return false;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
