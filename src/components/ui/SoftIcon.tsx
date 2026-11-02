import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors } from '@/constants/theme';

const icons = {
  home: 'home',
  shop: 'shop',
  basket: 'basket',
  profile: 'profile',
  grid: 'grid',
  leaf: 'leaf',
  diya: 'flame',
  plug: 'plug',
  plant: 'plant',
  gift: 'gift',
  coupon: 'ticket',
  crown: 'crown',
  calendar: 'calendar',
  heart: 'heart',
  box: 'box',
  refresh: 'refresh',
} as const satisfies Record<string, AppIconName>;

export type SoftIconName = keyof typeof icons;

type SoftIconProps = {
  name: SoftIconName;
  size?: number;
  color?: string;
};

export function SoftIcon({ name, size = 24, color = colors.text }: SoftIconProps) {
  return <AppIcon name={icons[name]} color={color} size={size} />;
}
