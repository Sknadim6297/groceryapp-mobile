import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { DiscountOff } from '@/components/ui/DiscountOff';
import { colors, fonts, space } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { useWishlist } from '@/context/WishlistContext';
import { isProductInStock } from '@/data/resolveWishlistProducts';
import { isDiscountedProduct } from '@/utils/productFilters';
import { computeUnitPrice } from '@/utils/unitPrice';
import type { DemoProduct } from '@/types/catalog';
import { formatRupee } from '@/utils/cartBill';
import { hapticLight, hapticSelection } from '@/utils/haptics';

type ProductCardProps = {
  product: DemoProduct;
  /** Slightly tighter type when the card is under about 140px wide. */
  compact?: boolean;
};

/** Fixed cart control width so ADD ↔ stepper never reflows the grid. */
const ACTION_WIDTH = 88;
const ACTION_HEIGHT = 32;

function ProductCardComponent({ product, compact = false }: ProductCardProps) {
  const { add, quantities, setQuantity } = useMockCart();
  const { isSaved, toggle } = useWishlist();
  const quantity = quantities[product.id] ?? 0;
  const saved = isSaved(product.id);
  const inStock = isProductInStock(product);
  const showMrp = product.compareAt != null && product.compareAt > product.price;
  const unitPrice = !compact ? computeUnitPrice(product.price, product.unit) : null;

  function openProduct() {
    const id = product.id.trim();
    if (!id) {
      return;
    }
    router.push({ pathname: '/product/[id]', params: { id } });
  }

  function toggleWish() {
    void hapticSelection();
    toggle(product.id);
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact, !inStock && styles.cardMuted]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${product.name}`}
        onPress={openProduct}
        style={styles.details}>
        <View style={[styles.photoFrame, compact && styles.photoFrameCompact]}>
          {isDiscountedProduct(product) && product.discountLabel ? (
            <DiscountOff label={product.discountLabel} tone="deal" />
          ) : null}
          <CatalogImage
            source={product.image}
            style={styles.photo}
            label={product.name}
            contentFit="cover"
            identityKey={product.id}
          />
          {!inStock ? (
            <View style={styles.oosBadge}>
              <Text style={styles.oosBadgeLabel}>OUT OF STOCK</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            accessibilityState={{ selected: saved }}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation?.();
              toggleWish();
            }}
            style={({ pressed }) => [styles.wishBtn, pressed && styles.wishPressed]}
            testID={`product-wish-${product.id}`}>
            <AppIcon name={saved ? 'heartFill' : 'heart'} color={saved ? colors.danger : colors.text} size={16} />
          </Pressable>
        </View>
        <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.name, compact && styles.nameCompact]}>
          {product.name}
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.unit}>
          {product.unit?.trim() ? product.unit : ' '}
        </Text>
        {unitPrice ? (
          <Text numberOfLines={1} style={styles.unitPrice}>
            {unitPrice.label}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.prices}>
          <Text numberOfLines={1} style={[styles.price, compact && styles.priceCompact]}>
            {formatRupee(product.price)}
          </Text>
          <Text numberOfLines={1} style={[styles.mrp, !showMrp && styles.mrpHidden]}>
            {showMrp ? formatRupee(product.compareAt ?? 0) : ' '}
          </Text>
        </View>

        <View style={styles.actionSlot}>
          {!inStock && quantity <= 0 ? (
            <View style={styles.oos}>
              <Text style={styles.oosLabel}>OUT</Text>
            </View>
          ) : quantity > 0 ? (
            <View style={styles.stepper} accessibilityRole="adjustable" accessibilityValue={{ min: 0, now: quantity }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Decrease ${product.name}`}
                hitSlop={6}
                onPress={() => {
                  void hapticLight();
                  setQuantity(product.id, quantity - 1);
                }}
                style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
                <AppIcon name="minus" color={colors.success} size={14} />
              </Pressable>
              <View style={styles.countSlot}>
                <Text style={styles.count} numberOfLines={1}>
                  {quantity}
                </Text>
              </View>
              {inStock ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${product.name}`}
                  hitSlop={6}
                  onPress={() => {
                    void hapticLight();
                    setQuantity(product.id, quantity + 1);
                  }}
                  style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
                  <AppIcon name="plus" color={colors.success} size={14} />
                </Pressable>
              ) : (
                <View style={styles.step} accessibilityElementsHidden>
                  <AppIcon name="plus" color={colors.border} size={14} />
                </View>
              )}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to the basket`}
              onPress={() => {
                void hapticLight();
                add(product.id);
              }}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}
              testID={`product-add-${product.id}`}>
              <Text style={styles.addLabel}>ADD</Text>
            </Pressable>
          )}
        </View>
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
  wishBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishPressed: {
    opacity: 0.85,
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
    minHeight: 15,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  unitPrice: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: ACTION_HEIGHT,
  },
  prices: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
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
  mrpHidden: {
    opacity: 0,
    textDecorationLine: 'none',
  },
  actionSlot: {
    width: ACTION_WIDTH,
    height: ACTION_HEIGHT,
    flexShrink: 0,
  },
  add: {
    width: '100%',
    height: '100%',
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
    width: '100%',
    height: '100%',
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
    width: '100%',
    height: '100%',
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
    minWidth: 28,
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
  pressed: {
    opacity: 0.82,
  },
});
