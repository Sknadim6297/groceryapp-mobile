import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii } from '@/constants/theme';
import type { DemoBrand } from '@/types/catalog';
import { brandInitials } from '@/utils/brandIdentity';

type ProductBrandCardProps = {
  brand: DemoBrand;
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

/**
 * PDP brand explore row — only when the product has a real catalogue Brand.
 * Navigates to brand-scoped Shop listing.
 */
export function ProductBrandCard({ brand }: ProductBrandCardProps) {
  const artwork = hasVerifiedBrandArtwork(brand);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${brand.name}. Explore all products.`}
      onPress={() =>
        router.push({
          pathname: '/shop',
          params: {
            brand: brand.name,
            category: undefined,
            parent: undefined,
            sub: undefined,
          },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID="product-brand-card">
      <View style={styles.markFrame}>
        {artwork ? (
          <Image source={brand.image} style={styles.mark} contentFit="contain" accessible={false} />
        ) : (
          <View style={styles.markFallback}>
            <Text style={styles.markLetter}>{brandInitials(brand.name)}</Text>
          </View>
        )}
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {brand.name}
        </Text>
        <Text style={styles.subtitle}>Explore all products</Text>
      </View>
      <AppIcon name="chevron" color={colors.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  markFrame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: '80%',
    height: '80%',
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
    fontSize: 16,
    color: colors.primaryInk,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
