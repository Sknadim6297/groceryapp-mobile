import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ProductCard } from '@/components/home/ProductCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { mockProducts } from '@/data/mockProducts';

export function PopularPicks() {
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.heading}>
            Popular picks
          </Text>
          <Text style={styles.subtitle}>Most loved, always in demand</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all popular picks"
          hitSlop={8}
          onPress={() => router.push('/shop')}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}>
          <Text style={styles.viewAllLabel}>View all</Text>
          <AppIcon name="chevron" color={colors.textSecondary} size={14} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} compact={compact} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 0,
    gap: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    flexShrink: 0,
  },
  viewAllLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
