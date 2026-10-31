import { SymbolView } from 'expo-symbols';
import androidLight from 'expo-symbols/androidWeights/light';
import androidMedium from 'expo-symbols/androidWeights/medium';
import type { ColorValue } from 'react-native';

const icons = {
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  cart: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' },
  menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  home: { ios: 'house', android: 'home', web: 'home' },
  homeFocused: { ios: 'house.fill', android: 'home', web: 'home' },
  shop: { ios: 'storefront', android: 'storefront', web: 'storefront' },
  stores: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  profile: { ios: 'person', android: 'person', web: 'person' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  bolt: { ios: 'bolt', android: 'bolt', web: 'bolt' },
  percent: { ios: 'percent', android: 'percent', web: 'percent' },
  leaf: { ios: 'leaf.fill', android: 'eco', web: 'eco' },
  arrow: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  phone: { ios: 'phone', android: 'call', web: 'call' },
  pencil: { ios: 'pencil', android: 'edit', web: 'edit' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  briefcase: { ios: 'briefcase', android: 'work', web: 'work' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  scan: { ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' },
  heart: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  heartFill: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  crown: { ios: 'crown', android: 'workspace_premium', web: 'workspace_premium' },
  box: { ios: 'shippingbox', android: 'inventory_2', web: 'inventory_2' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  headset: { ios: 'headphones', android: 'headset_mic', web: 'headset_mic' },
  truck: { ios: 'truck.box', android: 'local_shipping', web: 'local_shipping' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  leafLine: { ios: 'leaf', android: 'eco', web: 'eco' },
  flame: { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' },
  plug: { ios: 'powerplug', android: 'electrical_services', web: 'electrical_services' },
  plant: { ios: 'leaf.circle', android: 'potted_plant', web: 'potted_plant' },
  gift: { ios: 'gift', android: 'card_giftcard', web: 'card_giftcard' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  bag: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  star: { ios: 'star', android: 'star', web: 'star' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  card: { ios: 'creditcard', android: 'credit_card', web: 'credit_card' },
  link: { ios: 'link', android: 'link', web: 'link' },
} as const;

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
  weight?: 'medium' | 'light';
};

export function AppIcon({ name, color, size = 22, weight = 'medium' }: AppIconProps) {
  return (
    <SymbolView
      name={icons[name]}
      tintColor={color}
      size={size}
      weight={
        weight === 'light'
          ? { ios: 'light', android: androidLight }
          : { ios: 'medium', android: androidMedium }
      }
      style={{ width: size, height: size }}
    />
  );
}
