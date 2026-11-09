import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { mockBrands } from '@/data/mockBrands';
import type { DemoBrand } from '@/types/catalog';

type BrandCarouselProps = {
  /** Live brands derived from product Brand fields. */
  brands?: DemoBrand[];
};

function hasRemoteMark(brand: DemoBrand): boolean {
  return (
    typeof brand.image === 'object' &&
    brand.image != null &&
    'uri' in brand.image &&
    typeof brand.image.uri === 'string' &&
    /^https?:\/\//i.test(brand.image.uri)
  );
}

export function BrandCarousel({ brands: liveBrands }: BrandCarouselProps) {
  const brands = liveBrands ?? mockBrands;
  const live = liveBrands != null;

  if (brands.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={styles.heading}>
            Shop by Brands
          </Text>
          {live ? <Text style={styles.subtitle}>From this store’s catalogue</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all brands"
          hitSlop={8}
          onPress={() => router.push('/shop')}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}>
          <Text style={styles.viewAllLabel}>View all</Text>
          <AppIcon name="chevron" color={colors.textSecondary} size={14} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {brands.map((brand) => (
          <Pressable
            key={brand.id}
            accessibilityRole="button"
            accessibilityLabel={
              live ? `${brand.name}. Live brand from catalogue.` : `${brand.name}. Demo brand, not a live supplier.`
            }
            onPress={() =>
              router.push({
                pathname: '/shop',
                params: live ? { brand: brand.name } : { brand: brand.id },
              })
            }
            style={({ pressed }) => [styles.brand, pressed && styles.pressed]}>
            {hasRemoteMark(brand) ? (
              <Image source={brand.image} style={styles.mark} contentFit="cover" accessible={false} />
            ) : live ? (
              <View style={styles.markFallback}>
                <Text style={styles.markLetter}>{brand.name.trim().charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <Image source={brand.image} style={styles.mark} contentFit="cover" accessible={false} />
            )}
            <Text numberOfLines={1} style={styles.name}>
              {brand.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  headingCopy: {
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
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
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
    paddingHorizontal: 8,
    gap: 2,
  },
  brand: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
  },
  markFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryInk,
  },
  name: {
    width: '100%',
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.text,
    textAlign: 'center',
  },
});
