import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, homeLayout, radii, space } from '@/constants/theme';

type LoadingSkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Soft pulse placeholder. Stays static when reduced motion is preferred. */
export function LoadingSkeleton({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}: LoadingSkeletonProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.45);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/immutability -- shared value write
      opacity.value = 0.35;
      return;
    }
    opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
  }, [opacity, reduced]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, borderRadius }, animated, style]}
    />
  );
}

export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]} accessibilityLabel="Loading product">
      <LoadingSkeleton height={compact ? 88 : 110} borderRadius={radii.sm} />
      <LoadingSkeleton height={14} style={styles.gap} />
      <LoadingSkeleton height={12} width="60%" />
      <LoadingSkeleton height={compact ? 24 : 28} style={styles.gap} borderRadius={radii.xs} />
    </View>
  );
}

export function ProductGridSkeleton({
  columns = 2,
  count = 6,
  cardWidth,
}: {
  columns?: number;
  count?: number;
  cardWidth?: number;
}) {
  const items = Array.from({ length: count }, (_, index) => index);
  return (
    <View style={styles.grid} accessibilityLabel="Loading products">
      {items.map((index) => (
        <View
          key={index}
          style={[
            styles.gridCell,
            { width: cardWidth ?? `${Math.floor(100 / columns) - 1}%` as `${number}%` },
          ]}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export function CategoryChipSkeleton({ count = 8 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, index) => index);
  return (
    <View style={styles.chipRow} accessibilityLabel="Loading categories">
      {items.map((index) => (
        <View key={index} style={styles.chip}>
          <LoadingSkeleton width={56} height={56} borderRadius={28} />
          <LoadingSkeleton width={48} height={10} style={styles.gap} />
        </View>
      ))}
    </View>
  );
}

export function BannerSkeleton() {
  return (
    <View style={styles.banner} accessibilityLabel="Loading banner">
      <LoadingSkeleton height={120} borderRadius={radii.md} />
    </View>
  );
}

export function ProductDetailSkeleton() {
  return (
    <View style={styles.detail} accessibilityLabel="Loading product details">
      <LoadingSkeleton height={280} borderRadius={radii.md} />
      <View style={styles.thumbRow}>
        {[0, 1, 2, 3].map((index) => (
          <LoadingSkeleton key={index} width={56} height={56} borderRadius={radii.sm} />
        ))}
      </View>
      <LoadingSkeleton height={22} width="70%" style={styles.gap} />
      <LoadingSkeleton height={14} width="40%" style={styles.gap} />
      <LoadingSkeleton height={28} width="30%" style={styles.gap} />
      <LoadingSkeleton height={48} style={styles.gap} borderRadius={radii.md} />
    </View>
  );
}

/** Home-shaped skeleton: banner, categories, product rails. Keeps header outside. */
export function HomeCatalogSkeleton() {
  return (
    <View style={styles.home} accessibilityLabel="Loading home catalogue">
      <BannerSkeleton />
      <CategoryChipSkeleton count={6} />
      <LoadingSkeleton height={18} width="45%" style={styles.sectionTitle} />
      <ProductGridSkeleton columns={2} count={4} />
      <LoadingSkeleton height={18} width="40%" style={styles.sectionTitle} />
      <ProductGridSkeleton columns={2} count={4} />
    </View>
  );
}

/** Shop listing skeleton with sidebar chips + product grid. */
export function ShopCatalogSkeleton({ cardWidth }: { cardWidth?: number }) {
  return (
    <View style={styles.shop} accessibilityLabel="Loading shop catalogue">
      <View style={styles.shopSidebar}>
        {Array.from({ length: 8 }, (_, index) => (
          <LoadingSkeleton key={index} height={64} borderRadius={radii.sm} style={styles.shopChip} />
        ))}
      </View>
      <View style={styles.shopMain}>
        <ProductGridSkeleton columns={2} count={6} cardWidth={cardWidth} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.borderSubtle,
  },
  card: {
    flex: 1,
    padding: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    gap: 6,
  },
  cardCompact: {
    padding: 6,
  },
  gap: {
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: homeLayout.gutter,
  },
  gridCell: {
    marginBottom: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: homeLayout.gutter,
    paddingVertical: space.sm,
  },
  chip: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  banner: {
    paddingHorizontal: homeLayout.gutter,
    marginTop: space.sm,
  },
  detail: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
    gap: 10,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  home: {
    paddingBottom: space.xl,
    gap: space.md,
  },
  sectionTitle: {
    marginHorizontal: homeLayout.gutter,
    marginTop: space.sm,
  },
  shop: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 420,
  },
  shopSidebar: {
    width: 76,
    paddingTop: 8,
    paddingHorizontal: 6,
    gap: 8,
  },
  shopChip: {
    width: '100%',
  },
  shopMain: {
    flex: 1,
    paddingTop: 8,
  },
});
