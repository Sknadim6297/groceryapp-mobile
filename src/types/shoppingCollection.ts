import type { AppIconName } from '@/components/ui/AppIcon';
import type { DemoProduct } from '@/types/catalog';

/** Home quick-shop shortcut ids. */
export type ShoppingCollectionId = 'all' | 'fresh' | 'diwali' | 'electronics' | 'organic';

export type ShoppingCollectionChip = {
  id: string;
  label: string;
};

export type ShoppingCollectionHeroTone = 'warm' | 'fresh' | 'festive' | 'cool' | 'organic';

export type ShoppingCollectionDefinition = {
  id: ShoppingCollectionId;
  title: string;
  subtitle: string;
  icon: AppIconName;
  heroTone: ShoppingCollectionHeroTone;
  /** Seasonal collections can be turned off without removing the shortcut config. */
  seasonActive?: boolean;
  /** Small badge on the hero (e.g. Diwali "Shop now") — never invents an offer. */
  badgeLabel?: string;
  emptyTitle: string;
  emptyBody: string;
};

export type CollectionProduct = DemoProduct & {
  shelfId?: string;
  /** Chip ids this product belongs to within the collection. */
  chipIds: string[];
};
