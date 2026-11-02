import type { DemoProduct } from '@/types/catalog';

export type ProductDetailCopy = {
  brand: string;
  about: string;
};

const details: Record<string, ProductDetailCopy> = {
  eggs: {
    brand: 'FarmFresh',
    about: 'A tray of everyday eggs for breakfast, baking, and quick meals. Keep them refrigerated and use the pack within the date printed on the tray.',
  },
  tomatoes: {
    brand: 'Organic',
    about: 'Ripe tomatoes for salads, gravy, and sandwiches. Rinse before use and keep them in a cool spot so they stay firm.',
  },
  potatoes: {
    brand: 'Premium',
    about: 'Everyday potatoes for curries, fries, and mashed sides. Store them somewhere cool and dry, away from direct sunlight.',
  },
  'cooking-oil': {
    brand: 'SunPure',
    about: 'A one-litre bottle of cooking oil for tadka, frying, and daily meals. Close the cap after each use and store it away from heat.',
  },
  'sunflower-oil': {
    brand: 'GoldPress',
    about: 'Sunflower oil for shallow frying and everyday cooking. Shake well if it settles, and keep the bottle upright with the cap tight.',
  },
  basmati: {
    brand: 'Harvest',
    about: 'Long-grain basmati rice for biryani, pulao, and steamed rice. Rinse before cooking and store the pack in an airtight container.',
  },
  toothpaste: {
    brand: 'MintFresh',
    about: 'A mint toothpaste for daily brushing. Replace the cap after use and keep it out of reach of children.',
  },
  apples: {
    brand: 'Fresh',
    about: 'Crisp apples for snacking and fruit bowls. Rinse before eating and refrigerate if you want them to stay crunchy longer.',
  },
  'recent-tomatoes': {
    brand: 'Fresh',
    about: 'Tomatoes sold by the kilo for cooking and salads. Pick firm fruit, rinse before use, and keep them out of the fridge if you prefer them ripe.',
  },
  'recent-potatoes': {
    brand: 'Fresh',
    about: 'Potatoes for sabzi, paratha stuffing, and fries. Keep the bag in a dark, dry place so they do not turn green.',
  },
  coriander: {
    brand: 'Fresh',
    about: 'A small bunch of coriander for garnish and chutney. Wrap it in a damp cloth or stand the stems in water so the leaves stay green.',
  },
  curd: {
    brand: 'Natural',
    about: 'Plain curd for raita, smoothies, and meals. Keep the tub refrigerated and finish it within the date on the pack.',
  },
  'bought-onions': {
    brand: 'Fresh',
    about: 'Onions for daily cooking. Store them in a cool, airy place and keep them away from potatoes.',
  },
  'top-onions': {
    brand: 'Fresh',
    about: 'Onions for gravies, salads, and tadka. Choose firm bulbs and keep them dry so they last longer.',
  },
  carrots: {
    brand: 'Fresh',
    about: 'Carrots for sabzi, salads, and snacks. Rinse and peel before cooking, and refrigerate them in a bag so they stay crisp.',
  },
  cauliflower: {
    brand: 'Fresh',
    about: 'A whole cauliflower for dry sabzi, rice, and soups. Keep it unwashed in the fridge and cut it just before cooking.',
  },
  capsicum: {
    brand: 'Fresh',
    about: 'A mix of capsicum for stir-fries and salads. Rinse, remove the seeds, and refrigerate the rest in a closed box.',
  },
  bananas: {
    brand: 'Fresh',
    about: 'Ripe bananas for breakfast, smoothies, and snacking. Keep the bunch at room temperature and separate any fruit that ripens first.',
  },
  'toned-milk': {
    brand: 'DairyCo',
    about: 'Toned milk for tea, coffee, and cereal. Refrigerate after opening and use it within the date printed on the pack.',
  },
  'preview-cashew': {
    brand: 'Whole Farm Grocery',
    about: 'Whole cashews for snacking and sweets. Reseal the pack after opening and store it in an airtight jar.',
  },
  'preview-almonds': {
    brand: 'Whole Farm Grocery',
    about: 'Whole almonds for snacking and breakfast. Keep the pack sealed, or move them to a jar so they stay crisp.',
  },
  'preview-makhana': {
    brand: 'Whole Farm Grocery',
    about: 'Raw makhana for roasting and light snacks. Store the pack away from moisture and roast only what you need.',
  },
};

export function productDetailCopy(product: DemoProduct): ProductDetailCopy {
  return (
    details[product.id] ?? {
      brand: 'Fresh Basket',
      about: `${product.name} comes in a ${product.unit} pack. Check the pack for storage advice before you open it.`,
    }
  );
}
