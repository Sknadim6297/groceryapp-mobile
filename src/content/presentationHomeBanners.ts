import type { Href } from 'expo-router';

import { listActivePresentationBanners } from '@/content/presentationCatalog';
import type { HomePromoBanner, HomePromoBannerTone } from '@/data/homePromoBanners';

function hrefForBanner(targetType: string, targetId: string | null): Href {
  if (targetType === 'field' && targetId) {
    return { pathname: '/category/[id]', params: { id: targetId } };
  }
  if (targetType === 'category' && targetId) {
    return { pathname: '/shop', params: { category: targetId } };
  }
  return '/shop';
}

/** Honest homepage banners from the presentation CMS seed (no fake discounts). */
export function resolvePresentationHomeBanners(): HomePromoBanner[] {
  return listActivePresentationBanners().map((banner) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.ctaLabel,
    href: hrefForBanner(banner.targetType, banner.targetId),
    tone: (banner.tone ?? 'warm') as HomePromoBannerTone,
    accessibilityLabel: `${banner.title}. ${banner.subtitle}`,
    showProduceImage: banner.imageAsset.includes('banner-produce') || banner.imageAsset.includes('fresh'),
    presentationImage: banner.image,
  }));
}
