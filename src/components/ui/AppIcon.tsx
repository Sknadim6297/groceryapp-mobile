import type { LucideIcon, LucideProps } from 'lucide-react-native';
import {
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  Flame,
  Gift,
  Headset,
  Heart,
  House,
  Lamp,
  LayoutGrid,
  Leaf,
  Link,
  Lock,
  Mail,
  MapPin,
  Menu,
  Minus,
  Package,
  Pencil,
  Percent,
  Phone,
  Plug,
  Plus,
  RotateCw,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Sprout,
  Star,
  Store,
  TicketPercent,
  Truck,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import type { ColorValue } from 'react-native';

const icons = {
  clock: Clock,
  cart: ShoppingCart,
  menu: Menu,
  search: Search,
  home: House,
  homeFocused: House,
  shop: Store,
  stores: MapPin,
  profile: User,
  chevron: ChevronRight,
  bolt: Zap,
  percent: Percent,
  leaf: Leaf,
  arrow: ArrowRight,
  back: ChevronLeft,
  phone: Phone,
  pencil: Pencil,
  check: Check,
  lock: Lock,
  mail: Mail,
  calendar: Calendar,
  briefcase: Briefcase,
  bell: Bell,
  chevronDown: ChevronDown,
  scan: ScanLine,
  heart: Heart,
  heartFill: Heart,
  plus: Plus,
  minus: Minus,
  crown: Crown,
  box: Package,
  shield: ShieldCheck,
  headset: Headset,
  truck: Truck,
  grid: LayoutGrid,
  leafLine: Leaf,
  flame: Flame,
  plug: Plug,
  plant: Sprout,
  gift: Gift,
  refresh: RotateCw,
  bag: ShoppingBag,
  basket: ShoppingBasket,
  star: Star,
  close: X,
  card: CreditCard,
  link: Link,
  lamp: Lamp,
  ticket: TicketPercent,
} as const satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
  /** Kept so existing calls compile. Every icon uses the same 2px rounded stroke. */
  weight?: 'medium' | 'light';
};

const stroke: Pick<LucideProps, 'strokeWidth' | 'strokeLinecap' | 'strokeLinejoin'> = {
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function AppIcon({ name, color, size = 24 }: AppIconProps) {
  const Icon = icons[name];
  return (
    <Icon color={typeof color === 'string' ? color : '#171717'} size={size} {...stroke} />
  );
}
