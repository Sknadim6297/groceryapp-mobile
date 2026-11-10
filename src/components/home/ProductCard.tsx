import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppIcon } from '@/components/ui/AppIcon';
import { DiscountOff } from '@/components/ui/DiscountOff';
import { colors, fonts, radii, space } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { isProductInStock } from '@/data/resolveWishlistProducts';
import type { DemoProduct } from '@/types/catalog';
import { formatRupee } from '@/utils/cartBill';
import { hapticLight } from '@/utils/haptics';

type ProductCardProps = {
  product: DemoProduct;
  /** Slightly tighter type when the card is under about 140px wide. */
  compact?: boolean;
};

function ProductCardComponent({ product, compact = false }: ProductCardProps) {
  const { add, quantities, setQuantity } = useMockCart();
  const quantity = quantities[product.id] ?? 0;
  const inStock = isProductInStock(product);
  const showMrp = product.compareAt != null && product.compareAt > product.price;

  function openProduct() {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact, !inStock && styles.cardMuted]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${product.name}`}
        onPress={openProduct}
        style={styles.details}>
        <View style={[styles.photoFrame, compact && styles.photoFrameCompact]}>
          {product.discountLabel ? <DiscountOff label={product.discountLabel} tone="deal" /> : null}
          <CatalogImage source={product.image} style={styles.photo} label={product.name} contentFit="cover" />
          {!inStock ? (
            <View style={styles.oosBadge}>
              <Text style={styles.oosBadgeLabel}>OUT OF STOCK</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.name, compact && styles.nameCompact]}>
          {product.name}
        </Text>
        {product.unit ? (
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.unit}>
            {product.unit}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.prices}>
          <Text numberOfLines={1} style={[styles.price, compact && styles.priceCompact]}>
            {formatRupee(product.price)}
          </Text>
          {showMrp ? (
            <Text numberOfLines={1} style={styles.mrp}>
              {formatRupee(product.compareAt ?? 0)}
            </Text>
          ) : null}
        </View>
        {!inStock ? (
          <View style={styles.oos}>
            <Text style={styles.oosLabel}>OUT</Text>
          </View>
        ) : quantity > 0 ? (
          <View style={styles.stepper} accessibilityRole="adjustable" accessibilityValue={{ min: 0, now: quantity }}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${product.name}`}
              hitSlop={6}
              onPress={() => {
                void hapticLight();
                setQuantity(product.id, quantity - 1);
              }}
              style={styles.step}>
              <AppIcon name="minus" color={colors.success} size={14} />
            </AnimatedPressable>
            <View style={styles.countSlot}>
              <Text style={styles.count} numberOfLines={1}>
                {quantity}
              </Text>
            </View>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`Increase ${product.name}`}
              hitSlop={6}
              onPress={() => {
                void hapticLight();
                setQuantity(product.id, quantity + 1);
              }}
              style={styles.step}>
              <AppIcon name="plus" color={colors.success} size={14} />
            </AnimatedPressable>
          </View>
        ) : (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to the basket`}
            onPress={() => {
              void hapticLight();
              add(product.id);
            }}
            style={styles.add}
            testID={`product-add-${product.id}`}>
            <Text style={styles.addLabel}>ADD</Text>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: space.sm,
    overflow: 'hidden',
  },
  cardCompact: {
    padding: 6,
    borderRadius: 10,
  },
  cardMuted: {
    opacity: 0.92,
  },
  details: {
    minWidth: 0,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoFrameCompact: {
    borderRadius: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  oosBadge: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  oosBadgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  name: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.ink,
    includeFontPadding: false,
  },
  nameCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  unit: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  prices: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.ink,
  },
  priceCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  add: {
    minWidth: 64,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.success,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  oos: {
    minWidth: 52,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  stepper: {
    minWidth: 84,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  step: {
    flex: 1,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSlot: {
    minWidth: 24,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.success,
    includeFontPadding: false,
  },
});
