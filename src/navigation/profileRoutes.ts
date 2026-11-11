import type { Href } from 'expo-router';

/** Shared Profile destinations. Every Profile entry uses this route. */
export const profileRoutes = {
  tab: 'profile',
  profile: '/profile',
  login: '/login',
  account: '/edit-profile',
  completeProfile: '/complete-profile',
  addresses: '/addresses',
  wishlist: '/wishlist',
  /** Folder index route — cast until Expo typed routes regenerate. */
  shoppingLists: '/shopping-lists' as Href,
  savedCarts: '/saved-carts' as Href,
  help: '/help',
  /** FAQ Details — pass `{ id }` via `supportFaqDetailsHref`. */
  faqDetails: '/support/faq/[id]',
  /** Demo Live Chat — optional `faqId` via `supportChatHref`. */
  liveChat: '/support/chat',
  /** Demo payment preferences — separate from checkout `/payment`. */
  myPayment: '/my-payment',
} as const;
