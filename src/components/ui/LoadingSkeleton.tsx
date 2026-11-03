import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii } from '@/constants/theme';

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

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <LoadingSkeleton height={110} borderRadius={radii.sm} />
      <LoadingSkeleton height={14} style={styles.gap} />
      <LoadingSkeleton height={12} width="60%" />
      <LoadingSkeleton height={28} style={styles.gap} borderRadius={radii.xs} />
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
  gap: {
    marginTop: 4,
  },
});
