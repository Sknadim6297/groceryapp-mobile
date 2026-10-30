import { SymbolView } from 'expo-symbols';
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
} as const;

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
};

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  return (
    <SymbolView
      name={icons[name]}
      tintColor={color}
      size={size}
      weight={{ ios: 'medium', android: androidMedium }}
      style={{ width: size, height: size }}
    />
  );
}
