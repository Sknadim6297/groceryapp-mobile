import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';

import { colors, fonts, homeLayout } from '@/constants/theme';
import type { DemoBrand } from '@/types/catalog';
import { brandInitials } from '@/utils/brandIdentity';

type BrandCarouselProps = {
  /** Live brands derived from product Brand fields only. */
  brands: readonly DemoBrand[];
};

function hasVerifiedBrandArtwork(brand: DemoBrand): boolean {
  return (
    typeof brand.image === 'object' &&
    brand.image != null &&
    'uri' in brand.image &&
    typeof brand.image.uri === 'string' &&
    /^https?:\/\//i.test(brand.image.uri.trim())
  );
}

function openBrand(brand: DemoBrand) {
  router.push({
    pathname: '/shop',
    params: {
      brand: brand.name,
      category: undefined,
      parent: undefined,
      sub: undefined,
    },
  });
}

/**
 * Home "Shop by Brand" — unique catalogue brands only.
 * Never uses product photos as logos; initials when no verified brand artwork.
 */
export function BrandCarousel({ brands }: BrandCarouselProps) {
  const renderItem = useCallback<ListRenderItem<DemoBrand>>(
    ({ item }) => <BrandTile brand={item} />,
    [],
  );

  if (brands.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="shop-by-brand">
      <Text accessibilityRole="header" style={styles.heading}>
        Shop by Brand
      </Text>
      <FlatList
        horizontal
        data={brands as DemoBrand[]}
        keyExtractor={brandKeyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
}

function brandKeyExtractor(item: DemoBrand): string {
  return item.id;
}

const BrandTile = memo(function BrandTile({ brand }: { brand: DemoBrand }) {
  const artwork = hasVerifiedBrandArtwork(brand);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${brand.name}. Shop products from this brand.`}
      onPress={() => openBrand(brand)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={`brand-card-${brand.id}`}>
      <View style={styles.markFrame}>
        {artwork ? (
          <Image source={brand.image} style={styles.mark} contentFit="contain" accessible={false} />
        ) : (
          <View style={styles.markFallback} accessibilityElementsHidden>
            <Text style={styles.markLetter}>{brandInitials(brand.name)}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {brand.name}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  section: {
    marginHorizontal: homeLayout.gutter,
    marginTop: 14,
    marginBottom: 4,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  row: {
    gap: 12,
    paddingRight: 8,
    paddingBottom: 4,
  },
  card: {
    width: 88,
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.78,
  },
  markFrame: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: '78%',
    height: '78%',
  },
  markFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softYellow,
  },
  markLetter: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.primaryInk,
  },
  name: {
    width: '100%',
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
    textAlign: 'center',
    minHeight: 30,
  },
});
