/**
 * Local Support Center FAQ content for Mayapur Bazaar.
 * Demo/help copy only — not a live policy or ticket system.
 */

import type { AppIconName } from '@/components/ui/AppIcon';

export type SupportCategory = 'orders' | 'payments' | 'delivery' | 'account';

export type SupportFaqStep = {
  title: string;
  body: string;
};

export type SupportFaqItem = {
  id: string;
  question: string;
  /** Plain-text summary used for search and paragraph fallbacks. */
  answer: string;
  category: SupportCategory;
  keywords: string[];
  /** Shown in the compact home list on Support Center. */
  featured?: boolean;
  /** Optional intro line on the FAQ Details screen. */
  intro?: string;
  /** Optional numbered guidance steps on the FAQ Details screen. */
  steps?: SupportFaqStep[];
  /** Stable related FAQ ids (excludes self when resolved). */
  relatedIds?: string[];
  /** Accent icon on the FAQ Details card. */
  detailIcon?: AppIconName;
};

export const SUPPORT_CATEGORIES: {
  id: SupportCategory;
  title: string;
  description: string;
  icon: 'box' | 'card' | 'truck' | 'profile';
}[] = [
  { id: 'orders', title: 'Orders', description: 'Track, cancel, issues', icon: 'box' },
  { id: 'payments', title: 'Payments', description: 'Methods, refunds, transactions', icon: 'card' },
  { id: 'delivery', title: 'Delivery', description: 'Address, timing, charges', icon: 'truck' },
  { id: 'account', title: 'Account', description: 'Profile, phone, preferences', icon: 'profile' },
];

export const SUPPORT_FAQS: SupportFaqItem[] = [
  {
    id: 'faq-order-not-arrived',
    question: "My order didn't arrive yet",
    answer:
      'Open My Orders, select the order, then Track Order for the latest status. If delivery is overdue for your slot, use Live Chat preview or email support with your order ID. This app help text is guidance only — response times depend on your store’s support process.',
    category: 'orders',
    keywords: ['late', 'delay', 'tracking', 'arrived', 'delivery status'],
    featured: true,
    detailIcon: 'box',
    intro: "We're sorry for the delay. Here's what you can do:",
    steps: [
      {
        title: 'Check your order status',
        body: 'Open My Orders and select this order to view the latest available status and tracking updates.',
      },
      {
        title: 'Review the delivery details',
        body: 'Confirm the delivery address and any timing shown in the app. Preview ETAs are estimates, not confirmed SLAs.',
      },
      {
        title: 'Still need help?',
        body: 'Contact support with your order reference so the store can review the issue. Response times depend on store process.',
      },
    ],
    relatedIds: ['faq-cancel-order', 'faq-wrong-missing-items', 'faq-refund'],
  },
  {
    id: 'faq-wrong-missing-items',
    question: 'I received wrong or missing items',
    answer:
      'Check the order details against what you received. Note any wrong or missing items, then contact support with your order ID and photos if you have them. Replacement or credit depends on store policy and is not guaranteed by this demo help content.',
    category: 'orders',
    keywords: ['wrong', 'missing', 'incorrect', 'damaged', 'items'],
    featured: true,
    detailIcon: 'bag',
    intro: 'Use these steps to document the issue before contacting support:',
    steps: [
      {
        title: 'Compare with the order list',
        body: 'Open the order details and check each item against what arrived.',
      },
      {
        title: 'Note missing or wrong items',
        body: 'Write down product names and quantities. Photos can help if you contact support.',
      },
      {
        title: 'Contact support with your order ID',
        body: 'Replacement or credit depends on store policy and is not guaranteed by this demo help content.',
      },
    ],
    relatedIds: ['faq-order-not-arrived', 'faq-refund', 'faq-cancel-order'],
  },
  {
    id: 'faq-cancel-order',
    question: 'How can I cancel my order?',
    answer:
      'If the order is still packing or waiting for pickup, open Order Details and look for Cancel when available. Once out for delivery, cancellation may not be possible. Demo preview orders may not support live cancel APIs.',
    category: 'orders',
    keywords: ['cancel', 'stop', 'void'],
    featured: true,
    detailIcon: 'history',
    intro: 'Cancellation depends on order status:',
    steps: [
      {
        title: 'Open Order Details',
        body: 'Go to My Orders and select the order you want to cancel.',
      },
      {
        title: 'Look for Cancel when available',
        body: 'If the order is still packing or waiting for pickup, Cancel may appear. Once out for delivery, cancellation may not be possible.',
      },
      {
        title: 'Demo preview note',
        body: 'Demo preview orders may not support live cancel APIs until the store backend is connected.',
      },
    ],
    relatedIds: ['faq-order-not-arrived', 'faq-refund', 'faq-wrong-missing-items'],
  },
  {
    id: 'faq-refund',
    question: 'Can I get a refund?',
    answer:
      'Refund eligibility depends on payment method, order status, and store rules. Demo checkout in this app never charges a real card or UPI account. For a live order, contact support with your order ID — timelines are set by the store, not this screen.',
    category: 'payments',
    keywords: ['refund', 'money back', 'payment reverse'],
    featured: true,
    detailIcon: 'card',
    intro: 'Refunds are decided by store rules — this is guidance only:',
    steps: [
      {
        title: 'Confirm how you paid',
        body: 'Refund paths can differ for UPI, card, or cash on delivery when live payments are connected.',
      },
      {
        title: 'Check order status',
        body: 'Eligibility often depends on whether the order was delivered, cancelled, or partially fulfilled.',
      },
      {
        title: 'Contact support with your order ID',
        body: 'Timelines are set by the store. Demo checkout never charges a real card or UPI account.',
      },
    ],
    relatedIds: ['faq-payment-methods', 'faq-wrong-missing-items', 'faq-cancel-order'],
  },
  {
    id: 'faq-payment-methods',
    question: 'Which payment methods can I use?',
    answer:
      'Checkout may show demo methods such as UPI, card, or cash on delivery for preview. Real charges are disabled in demo mode. Saved payment preferences in My Payment are local to this app until a live payments backend is connected.',
    category: 'payments',
    keywords: ['upi', 'card', 'cod', 'payment method'],
    detailIcon: 'card',
    relatedIds: ['faq-refund', 'faq-cancel-order'],
  },
  {
    id: 'faq-delivery-address',
    question: 'How do I change my delivery address?',
    answer:
      'Use the delivery header on Home, or open Saved Addresses from Profile. You can pick a saved address or set a new pin on the map. Complete house/flat details when adding an address for checkout.',
    category: 'delivery',
    keywords: ['address', 'location', 'pin', 'change address'],
    detailIcon: 'stores',
    intro: 'You can update delivery location from a few places in the app:',
    steps: [
      {
        title: 'Use the Home delivery header',
        body: 'Tap the location row on Home to open Select Delivery Location.',
      },
      {
        title: 'Or open Saved Addresses',
        body: 'From Profile, choose a saved address or add a new pin on the map.',
      },
      {
        title: 'Complete address details',
        body: 'Add house/flat details when saving an address so checkout can use it.',
      },
    ],
    relatedIds: ['faq-delivery-slot', 'faq-order-not-arrived'],
  },
  {
    id: 'faq-delivery-slot',
    question: 'When will my order be delivered?',
    answer:
      'Delivery timing shown in the app is an estimate for your order status. Preview “minutes” banners are not confirmed SLAs. Check Track Order for live status updates when connected.',
    category: 'delivery',
    keywords: ['eta', 'time', 'slot', 'when'],
    detailIcon: 'clock',
    relatedIds: ['faq-order-not-arrived', 'faq-delivery-address'],
  },
  {
    id: 'faq-update-profile',
    question: 'How do I update my profile or phone number?',
    answer:
      'Open Profile → Edit Profile for name and optional email. Phone login uses OTP; changing the signed-in mobile number requires the account flow provided by your backend when available.',
    category: 'account',
    keywords: ['profile', 'phone', 'name', 'email'],
    detailIcon: 'profile',
    relatedIds: ['faq-notifications', 'faq-payment-methods'],
  },
  {
    id: 'faq-notifications',
    question: 'How do I manage notifications?',
    answer:
      'Open Notifications from the side menu or Profile. Demo notifications are preview content. Device push preferences may also be controlled in Settings when that screen is available.',
    category: 'account',
    keywords: ['notification', 'alerts', 'push'],
    detailIcon: 'bell',
    relatedIds: ['faq-update-profile'],
  },
];

export function supportFaqById(id: string): SupportFaqItem | undefined {
  return SUPPORT_FAQS.find((item) => item.id === id);
}

export function featuredSupportFaqs(limit = 4): SupportFaqItem[] {
  const featured = SUPPORT_FAQS.filter((item) => item.featured);
  if (featured.length >= limit) {
    return featured.slice(0, limit);
  }
  return SUPPORT_FAQS.slice(0, limit);
}

/** Related FAQs for the details screen — never includes the current id. */
export function relatedSupportFaqs(id: string, limit = 3): SupportFaqItem[] {
  const current = supportFaqById(id);
  if (!current) {
    return [];
  }

  const fromIds = (current.relatedIds ?? [])
    .map((relatedId) => supportFaqById(relatedId))
    .filter((item): item is SupportFaqItem => item != null && item.id !== id);

  if (fromIds.length > 0) {
    return fromIds.slice(0, limit);
  }

  return SUPPORT_FAQS.filter((item) => item.id !== id && item.category === current.category).slice(0, limit);
}

export function supportFaqDetailsHref(id: string) {
  return {
    pathname: '/support/faq/[id]' as const,
    params: { id },
  };
}
