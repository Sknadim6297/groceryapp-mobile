import { Image, type ImageSource } from 'expo-image';

const icons = {
  home: require('@/assets/images/icons3d/home.png') as ImageSource,
  shop: require('@/assets/images/icons3d/shop.png') as ImageSource,
  basket: require('@/assets/images/icons3d/basket.png') as ImageSource,
  profile: require('@/assets/images/icons3d/profile.png') as ImageSource,
  grid: require('@/assets/images/icons3d/grid.png') as ImageSource,
  leaf: require('@/assets/images/icons3d/leaf.png') as ImageSource,
  diya: require('@/assets/images/icons3d/diya.png') as ImageSource,
  plug: require('@/assets/images/icons3d/plug.png') as ImageSource,
  plant: require('@/assets/images/icons3d/plant.png') as ImageSource,
  gift: require('@/assets/images/icons3d/gift.png') as ImageSource,
  coupon: require('@/assets/images/icons3d/coupon.png') as ImageSource,
  crown: require('@/assets/images/icons3d/crown.png') as ImageSource,
  calendar: require('@/assets/images/icons3d/calendar.png') as ImageSource,
  heart: require('@/assets/images/icons3d/heart.png') as ImageSource,
  box: require('@/assets/images/icons3d/box.png') as ImageSource,
  refresh: require('@/assets/images/icons3d/refresh.png') as ImageSource,
} as const;

export type SoftIconName = keyof typeof icons;

type SoftIconProps = {
  name: SoftIconName;
  size?: number;
};

export function SoftIcon({ name, size = 24 }: SoftIconProps) {
  return (
    <Image
      source={icons[name]}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      accessible={false}
    />
  );
}
