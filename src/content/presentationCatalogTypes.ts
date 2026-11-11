import type { ImageSource } from 'expo-image';

export type PresentationTargetType = 'field' | 'category' | 'shop' | 'none';

export type PresentationFieldSeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageAsset: string;
  sortOrder: number;
  active: boolean;
  erpAliases: string[];
};

export type PresentationCategorySeed = {
  id: string;
  fieldId: string;
  name: string;
  slug: string;
  description: string;
  imageAsset: string;
  sortOrder: number;
  active: boolean;
  erpAliases: string[];
};

export type PresentationBannerSeed = {
  id: string;
  title: string;
  subtitle: string;
  imageAsset: string;
  ctaLabel: string;
  targetType: PresentationTargetType;
  targetId: string | null;
  sortOrder: number;
  active: boolean;
  tone?: 'warm' | 'violet' | 'green' | 'mint' | 'cream';
};

export type PresentationCatalogSeed = {
  version: number;
  generatedAt: string;
  note?: string;
  fields: PresentationFieldSeed[];
  categories: PresentationCategorySeed[];
  banners: PresentationBannerSeed[];
};

export type PresentationField = PresentationFieldSeed & {
  image: ImageSource;
};

export type PresentationCategory = PresentationCategorySeed & {
  image: ImageSource;
  productCount: number;
};

export type PresentationBanner = PresentationBannerSeed & {
  image: ImageSource;
};

export type PresentationTreeParent = {
  id: string;
  name: string;
  image: ImageSource;
  erpAliases: string[];
  children: {
    id: string;
    parentId: string;
    name: string;
    image: ImageSource;
    productCount: number;
    erpAliases: string[];
  }[];
};
