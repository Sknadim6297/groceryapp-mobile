import type { ImageSource } from 'expo-image';

import type { DemoProduct } from '@/types/catalog';

const bread = require('@/assets/images/home/cutouts/bread.png') as ImageSource;
const cereal = require('@/assets/images/home/cutouts/cereal.png') as ImageSource;
const juices = require('@/assets/images/home/cutouts/juices.png') as ImageSource;
const cleaning = require('@/assets/images/home/cutouts/household.png') as ImageSource;
const pet = require('@/assets/images/home/cutouts/pet-bowl.png') as ImageSource;
const frozen = require('@/assets/images/home/cutouts/frozen-veg.png') as ImageSource;
const eggs = require('@/assets/images/home/dairy-eggs.jpg') as ImageSource;
const tomatoes = require('@/assets/images/home/tomatoes.jpg') as ImageSource;
const potatoes = require('@/assets/images/home/potatoes.jpg') as ImageSource;
const oil = require('@/assets/images/home/cooking-oil.jpg') as ImageSource;
const grains = require('@/assets/images/home/grains.jpg') as ImageSource;
const apples = require('@/assets/images/home/apples.jpg') as ImageSource;
const onions = require('@/assets/images/home/cutouts/onions.png') as ImageSource;
const carrots = require('@/assets/images/home/cutouts/carrots.png') as ImageSource;
const cauliflower = require('@/assets/images/home/cutouts/cauliflower.png') as ImageSource;
const peppers = require('@/assets/images/home/cutouts/peppers.png') as ImageSource;
const coriander = require('@/assets/images/home/coriander.jpg') as ImageSource;
const curd = require('@/assets/images/home/curd.jpg') as ImageSource;
const personal = require('@/assets/images/home/personal.jpg') as ImageSource;

/** Display catalogue only. Prices are not live offers. */
export const dailyEssentials: { id: string; name: string; image: ImageSource }[] = [
  { id: 'bread', name: 'Bread & Bakery', image: bread },
  { id: 'breakfast', name: 'Breakfast', image: cereal },
  { id: 'beverages', name: 'Beverages', image: juices },
  { id: 'cleaning', name: 'Cleaning', image: cleaning },
  { id: 'pet', name: 'Pet Care', image: pet },
  { id: 'frozen', name: 'Frozen', image: frozen },
];

export const recommendedProducts: DemoProduct[] = [
  { id: 'eggs', name: 'FarmFresh Eggs', unit: '12 pcs', price: 72, compareAt: 90, discountLabel: '20% OFF', image: eggs },
  { id: 'tomatoes', name: 'Organic Tomatoes', unit: '500 g', price: 28, compareAt: 40, discountLabel: '30% OFF', image: tomatoes },
  { id: 'potatoes', name: 'Premium Potatoes', unit: '1 kg', price: 32, compareAt: 40, discountLabel: '20% OFF', image: potatoes },
  { id: 'cooking-oil', name: 'SunPure Cooking Oil', unit: '1 L', price: 110, compareAt: 135, discountLabel: '18% OFF', image: oil },
];

export const spotlightProducts: DemoProduct[] = [
  { id: 'sunflower-oil', name: 'GoldPress Sunflower Oil', unit: '1 L', price: 135, compareAt: 165, discountLabel: '18% OFF', image: oil },
  { id: 'basmati', name: 'Harvest Basmati Rice', unit: '5 kg', price: 549, compareAt: 649, discountLabel: '15% OFF', image: grains },
  { id: 'toothpaste', name: 'MintFresh Toothpaste', unit: '150 g', price: 99, compareAt: 120, discountLabel: '17% OFF', image: personal },
];

export const recentProducts: DemoProduct[] = [
  { id: 'apples', name: 'Fresh Apples', unit: '1 kg', price: 124, compareAt: 149, discountLabel: '17% OFF', image: apples },
  { id: 'recent-tomatoes', name: 'Tomatoes', unit: '1 kg', price: 32, compareAt: 40, discountLabel: '20% OFF', image: tomatoes },
  { id: 'recent-potatoes', name: 'Potatoes', unit: '1 kg', price: 28, compareAt: 36, discountLabel: '22% OFF', image: potatoes },
];

export const boughtAgain: DemoProduct[] = [
  { id: 'coriander', name: 'Fresh Coriander', unit: '100 g', price: 12, image: coriander },
  { id: 'curd', name: 'Natural Curd', unit: '400 g', price: 38, image: curd },
  { id: 'bought-onions', name: 'Onions', unit: '1 kg', price: 24, image: onions },
];

export const topSelling: DemoProduct[] = [
  { id: 'top-onions', name: 'Onions', unit: '1 kg', price: 29, compareAt: 36, discountLabel: '19% OFF', image: onions },
  { id: 'carrots', name: 'Carrots', unit: '500 g', price: 24, compareAt: 30, discountLabel: '20% OFF', image: carrots },
  { id: 'cauliflower', name: 'Cauliflower', unit: '1 pc', price: 42, compareAt: 50, discountLabel: '16% OFF', image: cauliflower },
  { id: 'capsicum', name: 'Capsicum Mix', unit: '500 g', price: 59, compareAt: 78, discountLabel: '24% OFF', image: peppers },
];
