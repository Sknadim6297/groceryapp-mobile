import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ProductCard } from '@/components/home/ProductCard';
import { productCardWidth, productColumns } from '@/components/home/productLayout';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { DemoProduct } from '@/types/catalog';

const SECTION_PAD = 24;
const GRID_GAP = 8;

type PopularPicksProps = {
  products?: DemoProduct[];
};

export function PopularPicks({ products = [] }: PopularPicksProps) {
  const { width } = useWindowDimensions();
  const columns = productColumns(width, 2, SECTION_PAD, GRID_GAP);
  const cardWidth = productCardWidth(width, columns, SECTION_PAD, GRID_GAP);
  const compact = cardWidth < 140;

  if (products.length === 0) {
    return null;
  }

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
        {products.map((product) => (
          <View key={product.id} style={{ width: cardWidth }}>
            <ProductCard product={product} compact={compact} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 0,
    gap: 8,
    overflow: 'hidden',
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
    flexWrap: 'wrap',
    gap: GRID_GAP,
    width: '100%',
    alignItems: 'stretch',
  },
});
