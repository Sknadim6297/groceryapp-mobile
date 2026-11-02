import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/home/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';
import { productCardWidth, productColumns } from '@/components/home/productLayout';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { productDetailCopy } from '@/data/productDetails';
import { relatedCatalogProducts } from '@/data/shopCatalog';
import { formatRupee } from '@/utils/cartBill';

const PAGE_PAD = 32;
const CARD_GAP = 8;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const product = productId ? findDemoProduct(productId) : undefined;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { add, quantities, setQuantity, totalCount } = useMockCart();
  const related = useMemo(() => (product ? relatedCatalogProducts(product.id) : null), [product]);
  const columns = productColumns(width, 2, PAGE_PAD, CARD_GAP);
  const cardWidth = productCardWidth(width, columns, PAGE_PAD, CARD_GAP);

  if (!product) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <BackButton />
          <Text style={styles.headerTitle}>Product</Text>
        </View>
        <Text style={styles.missing}>This item is not in the catalogue.</Text>
      </View>
    );
  }

  const quantity = quantities[product.id] ?? 0;
  const showMrp = product.compareAt != null && product.compareAt > product.price;
  const shelfName = related?.shelfName;
  const copy = productDetailCopy(product);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <BackButton />
        <Text numberOfLines={1} style={styles.headerTitle}>
          {product.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={totalCount > 0 ? `Cart, ${totalCount} items` : 'Cart'}
          hitSlop={8}
          onPress={() => router.push('/cart')}
          style={styles.cart}>
          <AppIcon name="cart" color={colors.text} size={22} />
          {totalCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{totalCount > 9 ? '9+' : String(totalCount)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        key={product.id}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sheet}>
          <ProductGallery product={product} />

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>
          <Text style={styles.price}>{formatRupee(product.price)}</Text>

          <Text accessibilityRole="header" style={styles.infoTitle}>
            Important Information
          </Text>
          <Text style={styles.about}>{copy.about}</Text>

          <View style={styles.facts}>
            <Fact label="Pack size" value={product.unit} first />
            {shelfName ? <Fact label="Category" value={shelfName} /> : null}
            {showMrp ? <Fact label="MRP" value={formatRupee(product.compareAt ?? 0)} /> : null}
          </View>
        </View>

        {related && related.products.length > 0 ? (
          <View style={styles.related}>
            <View style={styles.relatedHead}>
              <Text accessibilityRole="header" style={styles.relatedTitle}>
                You may also like
              </Text>
              {related.shelfId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View all ${shelfName ?? 'related'} products`}
                  hitSlop={8}
                  onPress={() => router.push({ pathname: '/shop', params: { category: related.shelfId ?? '' } })}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.grid}>
              {related.products.map((item) => (
                <View key={item.id} style={{ width: cardWidth }}>
                  <ProductCard product={item} compact={cardWidth < 100} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {quantity > 0 ? (
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${product.name}`}
              hitSlop={8}
              onPress={() => setQuantity(product.id, quantity - 1)}
              style={styles.step}>
              <AppIcon name="minus" color={colors.text} size={18} />
            </Pressable>
            <Text style={styles.count}>{quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Increase ${product.name}`}
              hitSlop={8}
              onPress={() => setQuantity(product.id, quantity + 1)}
              style={styles.step}>
              <AppIcon name="plus" color={colors.text} size={18} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to the cart`}
            onPress={() => add(product.id)}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
            <Text style={styles.addLabel}>ADD TO CART</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      style={styles.back}>
      <AppIcon name="back" color={colors.text} size={22} />
    </Pressable>
  );
}

function Fact({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[styles.fact, first && styles.factFirst]}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  header: {
    backgroundColor: colors.brightYellow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  cart: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
    includeFontPadding: false,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    alignSelf: 'center',
    paddingBottom: 16,
    gap: 12,
  },
  sheet: {
    backgroundColor: colors.white,
    paddingBottom: 16,
  },
  name: {
    marginTop: 4,
    marginHorizontal: 16,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    includeFontPadding: false,
  },
  unit: {
    marginTop: 6,
    marginHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  price: {
    marginTop: 6,
    marginHorizontal: 16,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    includeFontPadding: false,
  },
  infoTitle: {
    marginTop: 18,
    marginHorizontal: 16,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  about: {
    marginTop: 6,
    marginHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  facts: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  factFirst: {
    borderTopWidth: 0,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  factLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  factValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  related: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
  },
  relatedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  relatedTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  viewAll: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  add: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  addLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.6,
    color: colors.text,
  },
  stepper: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    minWidth: 28,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  pressed: {
    opacity: 0.78,
  },
  missing: {
    margin: 16,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
});
