import type { Href } from 'expo-router';

/**
 * Home promotional carousel slides.
 * Copy and destinations reuse existing Home banners — no invented live offers.
 */
export type HomePromoBannerId =
  | 'savings'
  | 'minutes'
  | 'delivery'
  | 'fruits'
  | 'demo-preview';

export type HomePromoBannerTone = 'warm' | 'violet' | 'green' | 'mint' | 'cream';

export type HomePromoBanner = {
  id: HomePromoBannerId;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: Href;
  tone: HomePromoBannerTone;
  /** Accessibility label — must mark demo timing/offers honestly. */
  accessibilityLabel: string;
  /** Optional corner badge text already shown on the original banners. */
  badgeLabel?: string;
  /** Explicit UI-preview-only slide. */
  demoOnly?: boolean;
  /** Use produce photo on the right when true. */
  showProduceImage?: boolean;
};

export const HOME_PROMO_BANNERS: readonly HomePromoBanner[] = [
  {
    id: 'savings',
    title: 'Big savings\non daily needs',
    subtitle: 'Fresh groceries at great prices every day',
    ctaLabel: 'Shop Deals',
    href: '/shop',
    tone: 'warm',
    accessibilityLabel: 'Demo offer. Big savings on daily needs.',
    badgeLabel: 'UP TO\n50% OFF',
    showProduceImage: true,
  },
  {
    id: 'minutes',
    title: 'Grocery in Minutes',
    subtitle: 'Daily essentials delivered super fast',
    ctaLabel: 'Order Now',
    href: '/shop',
    tone: 'violet',
    accessibilityLabel: 'Demo banner. Ten minutes is not a confirmed delivery time.',
    badgeLabel: '10\nMINS',
  },
  {
    id: 'delivery',
    title: 'Get Free Delivery',
    subtitle: 'On orders above ₹499',
    ctaLabel: 'Shop Now',
    href: '/shop',
    tone: 'green',
    accessibilityLabel: 'Demo banner. Free delivery is not confirmed.',
  },
  {
    id: 'fruits',
    title: 'Fresh Fruits & Vegetables',
    subtitle: 'Farm fresh • Handpicked • Hygienic',
    ctaLabel: 'Shop Now',
    href: { pathname: '/collection/[id]', params: { id: 'fresh' } },
    tone: 'mint',
    accessibilityLabel: 'Fresh fruits and vegetables. Open Fresh Essentials collection.',
    badgeLabel: '100%\nFresh',
    showProduceImage: true,
  },
];

/** Ensures the carousel always has at least two slides for peek + autoplay demo. */
export function resolveHomePromoBanners(
  banners: readonly HomePromoBanner[] = HOME_PROMO_BANNERS,
): HomePromoBanner[] {
  if (banners.length >= 2) {
    return [...banners];
  }
  const base = [...banners];
  base.push({
    id: 'demo-preview',
    title: 'Mayapur Bazaar\nDemo Banner',
    subtitle: 'UI preview only — not a live promotion',
    ctaLabel: 'Browse Shop',
    href: '/shop',
    tone: 'cream',
    accessibilityLabel: 'Demo banner for UI preview only. Not a live promotion.',
    badgeLabel: 'DEMO',
    demoOnly: true,
  });
  return base;
}
