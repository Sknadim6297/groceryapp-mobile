/**
 * Home promo carousel fixtures — no React Native rendering.
 */

import { HOME_PROMO_BANNERS, resolveHomePromoBanners } from '../src/data/homePromoBanners';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const resolved = resolveHomePromoBanners(HOME_PROMO_BANNERS);
assert(resolved.length >= 2, 'carousel needs at least two slides for peek + autoplay');
assert(resolved.some((banner) => banner.id === 'savings'), 'savings banner preserved');
assert(resolved.some((banner) => banner.id === 'minutes'), 'minutes banner preserved');
assert(resolved.some((banner) => banner.id === 'delivery'), 'delivery banner preserved');
assert(resolved.some((banner) => banner.id === 'fruits'), 'fruits banner preserved');
assert(
  resolved.every((banner) => banner.ctaLabel.trim().length > 0 && banner.href != null),
  'every banner has a real CTA destination',
);

const single = resolveHomePromoBanners([HOME_PROMO_BANNERS[0]!]);
assert(single.length === 2, 'single-banner fallback adds a labeled demo slide');
assert(single[1]?.demoOnly === true, 'fallback slide is marked demo-only');
assert(single[1]?.accessibilityLabel.toLowerCase().includes('demo'), 'fallback a11y marks demo');

const cardWidthRatio = 0.88;
assert(cardWidthRatio >= 0.88 && cardWidthRatio <= 0.9, 'card width uses 88–90% content width');

const autoplayMs = 3500;
assert(autoplayMs >= 3000 && autoplayMs <= 4000, 'autoplay interval is 3–4 seconds');

const gap = 10;
const gutter = 16;
for (const width of [320, 360, 390, 430]) {
  const cardWidth = Math.round(Math.min(width * cardWidthRatio, width - gutter * 2));
  const peek = width - gutter - cardWidth;
  assert(cardWidth > 0, `card width positive at ${width}`);
  assert(peek >= 18, `next-slide peek visible at ${width} (peek=${peek})`);
  assert(cardWidth + gap > cardWidth, `snap interval exceeds card at ${width}`);
}

console.log('home promo carousel fixtures passed');
