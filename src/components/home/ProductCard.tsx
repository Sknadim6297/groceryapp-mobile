import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppIcon } from '@/components/ui/AppIcon';
import { DiscountOff } from '@/components/ui/DiscountOff';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { useWishlist } from '@/context/WishlistContext';
import { isProductInStock } from '@/data/resolveWishlistProducts';
import type { DemoProduct } from '@/types/catalog';
import { formatRupee } from '@/utils/cartBill';
import { hapticLight, hapticSelection } from '@/utils/haptics';

type ProductCardProps = {
  product: DemoProduct;
  /** Slightly tighter type when the card is under about 140px wide. */
  compact?: boolean;
};

function ProductCardComponent({ product, compact = false }: ProductCardProps) {
  const { add, quantities, setQuantity } = useMockCart();
  const { isSaved, toggle } = useWishlist();
  const quantity = quantities[product.id] ?? 0;
  const saved = isSaved(product.id);
  const inStock = isProductInStock(product);
  const showMrp = product.compareAt != null && product.compareAt > product.price;

  function openProduct() {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact, !inStock && styles.cardMuted]}>
      <View style={styles.chrome}>
        <View style={styles.badgeSlot}>
          {product.discountLabel ? <DiscountOff label={product.discountLabel} inline /> : null}
        </View>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          accessibilityState={{ selected: saved }}
          hitSlop={8}
          onPress={() => {
            void hapticSelection();
            toggle(product.id);
          }}
          style={styles.heart}>
          <AppIcon name={saved ? 'heartFill' : 'heart'} color={saved ? colors.danger : '#CBD5E1'} size={16} />
        </AnimatedPressable>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${product.name}`} onPress={openProduct} style={styles.details}>
        <View style={[styles.photoFrame, compact && styles.photoFrameCompact]}>
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
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.unit}>
          {product.unit}
        </Text>
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
            <Text style={styles.oosLabel}>OUT OF STOCK</Text>
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
              <AppIcon name="minus" color={colors.primaryInk} size={16} />
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
              <AppIcon name="plus" color={colors.primaryInk} size={16} />
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
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    paddingHorizontal: space.sm,
    paddingTop: space.xs,
    paddingBottom: space.sm,
    overflow: 'hidden',
    ...shadow.soft,
  },
  cardCompact: {
    paddingHorizontal: space.xs,
    borderRadius: radii.xs,
  },
  cardMuted: {
    opacity: 0.92,
  },
  chrome: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  heart: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  details: {
    minWidth: 0,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.22,
    borderRadius: radii.xs,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoFrameCompact: {
    aspectRatio: 1.22,
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
    marginTop: space.sm,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
    includeFontPadding: false,
  },
  nameCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  unit: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: space.xs,
    gap: space.xs,
  },
  prices: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
    minWidth: 0,
  },
  price: {
    flexShrink: 0,
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
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  add: {
    height: 32,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
  oos: {
    height: 32,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  stepper: {
    height: 32,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  step: {
    flex: 1,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSlot: {
    minWidth: 28,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primaryInk,
    includeFontPadding: false,
  },
});
