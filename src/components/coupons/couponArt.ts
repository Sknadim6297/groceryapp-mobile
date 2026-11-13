import type { ImageSource } from 'expo-image';

import type { DemoCoupon } from '@/types/coupons';

const produce = require('@/assets/images/home/cutouts/produce-offer.webp') as ImageSource;
const dairy = require('@/assets/images/home/dairy-eggs.jpg') as ImageSource;
const fruits = require('@/assets/images/home/fresh-fruits.jpg') as ImageSource;
const household = require('@/assets/images/home/cutouts/household.webp') as ImageSource;
const snacks = require('@/assets/images/home/cutouts/snacks-drinks.webp') as ImageSource;

export const COUPON_ILLUSTRATIONS: Record<DemoCoupon['illustration'], ImageSource> = {
  produce,
  dairy,
  fruits,
  household,
  snacks,
};

export const COUPON_TONE_COLORS: Record<
  DemoCoupon['tone'],
  { start: string; end: string; accent: string }
> = {
  yellow: { start: '#FDE047', end: '#FEF9C3', accent: '#CA8A04' },
  peach: { start: '#FED7AA', end: '#FFF7ED', accent: '#C2410C' },
  mint: { start: '#BBF7D0', end: '#F0FDF4', accent: '#15803D' },
  sky: { start: '#BAE6FD', end: '#F0F9FF', accent: '#0369A1' },
  lavender: { start: '#E9D5FF', end: '#FAF5FF', accent: '#7E22CE' },
};
