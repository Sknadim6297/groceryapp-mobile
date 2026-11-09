import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/home/ProductCard';
import { productCardWidth, productColumns } from '@/components/home/productLayout';
import { ProductAccordion } from '@/components/product/ProductAccordion';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductReviewsPanel } from '@/components/product/ProductReviewsPanel';
import { ProductStarRating } from '@/components/product/ProductStarRating';
import { ProductTrustBadges } from '@/components/product/ProductTrustBadges';
import { WriteReviewSheet } from '@/components/product/WriteReviewSheet';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { CatalogStatusPanel } from '@/components/ui/CatalogStatusPanel';
import { ProductDetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCatalog } from '@/context/CatalogContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useMockCart } from '@/context/MockCartContext';
import { useProductReviews } from '@/context/ProductReviewsContext';
import { useWishlist } from '@/context/WishlistContext';
import { productDetailCopy } from '@/data/productDetails';
import { isProductInStock } from '@/data/resolveWishlistProducts';
import type { ReviewSortId } from '@/types/productReviews';
import { formatRupee } from '@/utils/cartBill';

const PAGE_PAD = 32;
const CARD_GAP = 8;

type AccordionId = 'key' | 'info' | 'review' | null;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { quantities, setQuantity, totalCount } = useMockCart();
  const { isSaved, toggle } = useWishlist();
  const { profile } = useCustomerProfile();
  const { session } = useAuthSession();
  const { findProduct, relatedProducts, initialLoading, liveEnabled, state, message, refresh, refreshing } =
    useCatalog();
  const { summaryFor, sortedReviewsFor, voteFor, setVote, submitReview } = useProductReviews();
  const product = productId ? findProduct(productId) : undefined;

  const [openAccordion, setOpenAccordion] = useState<AccordionId>('review');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sort, setSort] = useState<ReviewSortId>('newest');
  const [writeOpen, setWriteOpen] = useState(false);
  const [selectQty, setSelectQty] = useState(1);
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  }

  useEffect(() => {
    setSelectQty(1);
  }, [productId]);

  const related = useMemo(
    () => (product ? relatedProducts(product.id, 6) : null),
    [product, relatedProducts],
  );
  const columns = productColumns(width, 2, PAGE_PAD, CARD_GAP);
  const cardWidth = productCardWidth(width, columns, PAGE_PAD, CARD_GAP);

  const summary = product ? summaryFor(product.id) : null;
  const reviews = product ? sortedReviewsFor(product.id, sort) : [];

  if (liveEnabled && initialLoading) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Product Details" />
        <ProductDetailSkeleton />
      </View>
    );
  }

  if (liveEnabled && state.status === 'error' && !product) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Product Details" />
        <CatalogStatusPanel
          kind="error"
          message={message}
          onRetry={() => void handleRetry()}
          retrying={retrying || refreshing}
        />
      </View>
    );
  }

  if (!product || !summary) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Product Details" />
        <CatalogStatusPanel
          kind="empty"
          title="Product unavailable"
          message="This item is not in the catalogue."
          onRetry={liveEnabled ? () => void handleRetry() : undefined}
          retrying={retrying || refreshing}
        />
      </View>
    );
  }

  const activeId = product.id;
  const quantity = quantities[activeId] ?? 0;
  const saved = isSaved(activeId);
  const inStock = isProductInStock(product);
  const showMrp = product.compareAt != null && product.compareAt > product.price;
  const shelfName = related?.shelfName;
  const copy = productDetailCopy(product);
  const authorName = profile?.name?.trim() || session?.name?.trim() || 'Guest';
  const lineTotal = product.price * selectQty;

  function toggleAccordion(id: AccordionId) {
    setOpenAccordion((current) => (current === id ? null : id));
  }

  function bumpSelectQty(delta: number) {
    setSelectQty((current) => Math.max(1, Math.min(99, current + delta)));
  }

  function addSelectedToCart() {
    if (!inStock) {
      return;
    }
    setQuantity(activeId, quantity + selectQty);
    setSelectQty(1);
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader
        title="Product Details"
        right={
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
        }
      />

      <ScrollView
        key={product.id}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <ProductGallery product={product} />

          <View style={styles.infoPad}>
            <Text style={styles.name}>
              {product.name}
              {product.unit ? ` – ${product.unit}` : ''}
            </Text>

            <View style={styles.ratingRow}>
              <ProductStarRating rating={summary.average || 0} size={15} />
              <Text style={styles.reviewCount}>
                ({summary.total} review{summary.total === 1 ? '' : 's'})
              </Text>
              <View style={styles.spacer} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
                accessibilityState={{ selected: saved }}
                hitSlop={8}
                onPress={() => toggle(product.id)}
                style={styles.roundAction}>
                <AppIcon name={saved ? 'heartFill' : 'heart'} color={saved ? colors.danger : colors.text} size={18} />
              </Pressable>
            </View>

            <View style={styles.brandRow}>
              <Text style={styles.brand}>{copy.brand}</Text>
              {shelfName ? <Text style={styles.shelf}>{shelfName}</Text> : null}
            </View>

            <Text style={styles.blurb} numberOfLines={detailsOpen ? undefined : 2}>
              {copy.about}
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatRupee(product.price)}</Text>
              {showMrp ? <Text style={styles.mrp}>{formatRupee(product.compareAt ?? 0)}</Text> : null}
              {product.discountLabel ? (
                <View style={styles.dealChip}>
                  <Text style={styles.dealChipLabel}>{product.discountLabel}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: detailsOpen }}
              onPress={() => setDetailsOpen((value) => !value)}
              style={styles.detailsToggle}>
              <Text style={styles.detailsToggleLabel}>View product details</Text>
              <AppIcon name={detailsOpen ? 'chevronDown' : 'chevron'} color={colors.primaryInk} size={16} />
            </Pressable>

            {detailsOpen ? (
              <View style={styles.facts}>
                <Fact label="Pack size" value={product.unit} first />
                {shelfName ? <Fact label="Category" value={shelfName} /> : null}
                <Fact label="Brand" value={copy.brand} />
                {showMrp ? <Fact label="MRP" value={formatRupee(product.compareAt ?? 0)} /> : null}
                <Fact label="Availability" value={inStock ? 'In stock' : 'Out of stock'} />
              </View>
            ) : null}

            <ProductTrustBadges />
          </View>
        </View>

        <View style={styles.accordionStack}>
          <ProductAccordion
            title="Key Information"
            open={openAccordion === 'key'}
            onToggle={() => toggleAccordion('key')}>
            <Text style={styles.accordionBody}>{copy.about}</Text>
            <Fact label="Pack size" value={product.unit} first />
            {shelfName ? <Fact label="Category" value={shelfName} /> : null}
            <Fact label="Brand" value={copy.brand} />
          </ProductAccordion>

          <ProductAccordion title="Info" open={openAccordion === 'info'} onToggle={() => toggleAccordion('info')}>
            <Text style={styles.accordionBody}>
              Store as directed on the pack. Prices shown are for this preview catalogue and may differ from a live
              store quote.
            </Text>
            <Fact label="Sold by" value={copy.brand} first />
            <Fact label="Return window" value="72 hours (store policy)" />
            <Fact label="Support" value="In-app Help & chat" />
          </ProductAccordion>

          <ProductAccordion
            title="Review"
            open={openAccordion === 'review'}
            onToggle={() => toggleAccordion('review')}
            badge={`${summary.total}`}>
            <ProductReviewsPanel
              summary={summary}
              reviews={reviews}
              sort={sort}
              onSortChange={setSort}
              voteFor={voteFor}
              onVote={setVote}
              onWriteReview={() => setWriteOpen(true)}
              compact
            />
          </ProductAccordion>
        </View>

        {related && related.products.length > 0 ? (
          <View style={styles.related}>
            <View style={styles.relatedHead}>
              <Text accessibilityRole="header" style={styles.relatedTitle}>
                You May Also Like
              </Text>
              {related.shelfId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`See all ${shelfName ?? 'related'} products`}
                  hitSlop={8}
                  onPress={() => router.push({ pathname: '/shop', params: { category: related.shelfId ?? '' } })}>
                  <Text style={styles.seeAll}>See All</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRail}>
              {related.products.map((item) => (
                <View key={item.id} style={{ width: Math.min(148, cardWidth + 8) }}>
                  <ProductCard product={item} compact />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]} testID="product-detail-footer">
        {!inStock ? (
          <View style={styles.oos}>
            <Text style={styles.oosLabel}>Out of stock</Text>
          </View>
        ) : (
          <>
            <View style={styles.footerMeta}>
              <View style={styles.qtyBlock}>
                <Text style={styles.metaLabel}>Select quantity</Text>
                <View style={styles.qtyStepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity`}
                    accessibilityState={{ disabled: selectQty <= 1 }}
                    disabled={selectQty <= 1}
                    hitSlop={6}
                    onPress={() => bumpSelectQty(-1)}
                    style={({ pressed }) => [
                      styles.qtyBtn,
                      selectQty <= 1 && styles.qtyBtnDisabled,
                      pressed && selectQty > 1 && styles.pressed,
                    ]}
                    testID="product-qty-minus">
                    <AppIcon name="minus" color={colors.text} size={16} />
                  </Pressable>
                  <Text style={styles.qtyValue} testID="product-qty-value">
                    {selectQty}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity`}
                    hitSlop={6}
                    onPress={() => bumpSelectQty(1)}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
                    testID="product-qty-plus">
                    <AppIcon name="plus" color={colors.text} size={16} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.totalBlock}>
                <Text style={styles.metaLabel}>Total</Text>
                <Text style={styles.totalValue} testID="product-line-total">
                  {formatRupee(lineTotal)}
                </Text>
              </View>
            </View>

            <View style={styles.footerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
                }
                accessibilityState={{ selected: saved }}
                onPress={() => toggle(product.id)}
                style={({ pressed }) => [styles.wishBtn, pressed && styles.pressed]}
                testID="product-footer-wishlist">
                <AppIcon
                  name={saved ? 'heartFill' : 'heart'}
                  color={saved ? colors.danger : colors.text}
                  size={22}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${selectQty} ${product.name} to the cart`}
                onPress={addSelectedToCart}
                style={({ pressed }) => [styles.add, pressed && styles.pressed]}
                testID="product-add-to-cart">
                <Text style={styles.addLabel}>Add To Cart</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <WriteReviewSheet
        visible={writeOpen}
        productName={product.name}
        authorName={authorName}
        onClose={() => setWriteOpen(false)}
        onSubmit={(draft) => {
          const result = submitReview({
            productId: product.id,
            rating: draft.rating,
            body: draft.body,
            tags: draft.tags,
            photoUris: draft.photoUris,
            authorName,
          });
          if (!result.ok) {
            return result;
          }
          setOpenAccordion('review');
          setSort('newest');
          return { ok: true };
        }}
      />
    </View>
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
    backgroundColor: colors.warmBackground,
  },
  cart: {
    width: 40,
    height: 40,
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
    paddingBottom: 20,
    gap: 12,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  infoPad: {
    paddingHorizontal: homeLayout.gutter,
    paddingBottom: space.lg,
    gap: 10,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewCount: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
  },
  roundAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brand: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  shelf: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  blurb: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  dealChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
  },
  dealChipLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  detailsToggleLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  facts: {
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
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
    backgroundColor: colors.white,
  },
  factLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  factValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  accordionStack: {
    paddingHorizontal: homeLayout.gutter,
    gap: 10,
  },
  accordionBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  related: {
    paddingTop: 4,
    gap: 10,
  },
  relatedHead: {
    paddingHorizontal: homeLayout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  seeAll: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  relatedRail: {
    paddingHorizontal: homeLayout.gutter,
    gap: 10,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 14,
    gap: 14,
    ...shadow.card,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  qtyBlock: {
    gap: 8,
  },
  totalBlock: {
    alignItems: 'flex-end',
    gap: 8,
  },
  metaLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyValue: {
    minWidth: 28,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.3,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wishBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  addLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  oos: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.78,
  },
  missing: {
    margin: 16,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  retry: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.softYellow,
  },
  retryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
});
