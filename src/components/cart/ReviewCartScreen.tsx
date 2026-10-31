import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { previewCouponById } from '@/data/previewCoupons';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import type { DemoProduct } from '@/types/catalog';
import { buildCartBill, formatRupee, type CartLine } from '@/utils/cartBill';

type KnownLine = { id: string; quantity: number; product: DemoProduct };
type MissingLine = { id: string; quantity: number; product: null };
type ReviewLine = KnownLine | MissingLine;

export function ReviewCartScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<{ scrollTo: (options: { y: number; animated?: boolean }) => void } | null>(null);
  const billOffset = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { quantities, leaveAtDoor, setQuantity, setLeaveAtDoor } = useMockCart();
  const { couponId } = usePreviewSession();
  const { confirmed } = useDeliveryLocation();

  const lines = Object.entries(quantities).map(([id, quantity]): ReviewLine => {
    const product = findDemoProduct(id);
    return product ? { id, quantity, product } : { id, quantity, product: null };
  });
  const known = lines.filter((line): line is KnownLine => line.product !== null);
  const missing = lines.filter((line): line is MissingLine => line.product === null);
  const bill = buildCartBill(known.map((line) => ({ product: line.product, quantity: line.quantity }) satisfies CartLine));
  const coupon = UI_PREVIEW_MODE ? previewCouponById(couponId) : undefined;
  const couponOff = coupon && bill.subtotal >= coupon.minimum ? coupon.amount : 0;
  const payable = Math.max(0, bill.subtotal - couponOff);
  const address = confirmed ? formatDeliveryAddress(confirmed) : 'Select delivery location';
  const addressLabel = confirmed?.label ? `Delivery to ${confirmed.label.toUpperCase()}` : 'Delivery address';

  function openLocation() {
    router.push('/location');
  }

  function showBill() {
    scrollRef.current?.scrollTo({ y: Math.max(0, billOffset.current - 8), animated: true });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
          <AppIcon name="back" color={colors.text} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Review Cart</Text>
          <Text style={styles.headerSubtitle}>GroceryApp</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <AppIcon name="profile" color={colors.white} size={18} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          accessibilityState={{ expanded: menuOpen }}
          hitSlop={8}
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <AppIcon name="menu" color={colors.white} size={18} />
        </Pressable>
      </View>

      {lines.length === 0 ? (
        <View style={styles.empty}>
          <SoftIcon name="basket" size={56} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCopy}>Add items from the shop. Prices stay on this device until you leave the app.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse the shop"
            onPress={() => router.push('/shop')}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
            <Text style={styles.emptyButtonLabel}>Browse shop</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            ref={(node) => {
              scrollRef.current = node;
            }}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.savings} accessibilityRole="summary">
              <Text style={styles.savingsLeft}>
                {bill.savings > 0 ? `${formatRupee(bill.savings)} Savings` : 'No savings on this cart'}
              </Text>
              <Text style={styles.savingsRight}>Delivery fee is not confirmed</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={UI_PREVIEW_MODE ? 'Apply a simulated coupon' : 'Apply coupons. Coupons are not connected yet.'}
              onPress={() => router.push(UI_PREVIEW_MODE ? '/coupons' : '/shop')}
              style={({ pressed }) => [styles.card, styles.coupon, pressed && styles.pressed]}>
              <SoftIcon name="coupon" size={28} />
              <View style={styles.couponCopy}>
                <Text style={styles.cardTitle}>Apply Coupons</Text>
                <Text style={styles.cardSub}>
                  {coupon ? `${coupon.title}. Simulated, not a live offer.` : UI_PREVIEW_MODE ? 'Preview coupons only. Nothing is redeemed.' : 'Coupons are not connected yet.'}
                </Text>
              </View>
              <AppIcon name="chevron" color={colors.textSecondary} size={18} />
            </Pressable>

            <View style={styles.card}>
              <View style={styles.sectionHead}>
                <SoftIcon name="basket" size={26} />
                <View style={styles.sectionCopy}>
                  <Text style={styles.cardTitle}>Review Items</Text>
                  <Text style={styles.cardSub}>
                    {bill.itemCount} {bill.itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              {known.map((line) => (
                <View key={line.id} style={styles.item}>
                  <CatalogImage source={line.product.image} style={styles.itemImage} label={line.product.name} />
                  <View style={styles.itemBody}>
                    <View style={styles.itemTop}>
                      <Text numberOfLines={2} style={styles.itemName}>
                        {line.product.name}
                      </Text>
                      <Text style={styles.itemPrice}>{formatRupee(line.product.price * line.quantity)}</Text>
                    </View>
                    <Text style={styles.itemUnit}>{line.product.unit}</Text>
                    <View style={styles.stepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease ${line.product.name}`}
                        hitSlop={6}
                        onPress={() => setQuantity(line.id, line.quantity - 1)}
                        style={styles.stepButton}>
                        <AppIcon name="minus" color={colors.text} size={14} />
                      </Pressable>
                      <Text style={styles.stepCount}>{line.quantity}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Increase ${line.product.name}`}
                        hitSlop={6}
                        onPress={() => setQuantity(line.id, line.quantity + 1)}
                        style={styles.stepButton}>
                        <AppIcon name="plus" color={colors.text} size={14} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
              {missing.map((line) => (
                <View key={line.id} style={styles.item}>
                  <View style={styles.missingImage} />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName}>Item unavailable</Text>
                    <Text style={styles.cardSub}>This product is not in the catalogue, so it is not included in the total.</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove unavailable item"
                      onPress={() => setQuantity(line.id, 0)}
                      style={styles.remove}>
                      <Text style={styles.removeLabel}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: leaveAtDoor }}
              aria-checked={leaveAtDoor}
              accessibilityLabel="Leave the order at door or gate"
              onPress={() => setLeaveAtDoor(!leaveAtDoor)}
              style={[styles.card, styles.door]}>
              <View style={styles.doorCopy}>
                <Text style={styles.cardTitle}>Leave the order at door or gate</Text>
                <Text style={styles.cardSub}>
                  Opt for no-contact delivery and the delivery partner will leave it at your door or gate.
                </Text>
              </View>
              <View style={[styles.checkbox, leaveAtDoor && styles.checkboxOn]}>
                {leaveAtDoor ? <AppIcon name="check" color={colors.text} size={14} /> : null}
              </View>
            </Pressable>

            <View
              style={styles.card}
              onLayout={(event) => {
                billOffset.current = event.nativeEvent.layout.y;
              }}>
              <Text style={styles.cardTitle}>Bill Details</Text>
              <BillRow label="MRP Total" value={formatRupee(bill.mrpTotal)} />
              <BillRow
                label="Delivery Partner Fee"
                value={formatRupee(bill.deliveryPartnerFee)}
                hint="Not a confirmed delivery charge."
              />
              <BillRow label="Handling Fee" value={formatRupee(bill.handlingFee)} hint="Not a confirmed handling charge." />
              <View style={styles.subtotal}>
                <Text style={styles.subtotalLabel}>Subtotal</Text>
                <Text style={styles.subtotalValue}>{formatRupee(bill.subtotal)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cancellation policy</Text>
              <PolicyCard
                icon="clock"
                text="Orders cannot be cancelled and are non-refundable once packed for delivery."
              />
              <PolicyCard
                icon="shield"
                text="In case of unexpected delays or issues, a refund will be provided."
              />
              <Text style={styles.policyNote}>Check your order and address details before placing the order.</Text>
              <Pressable accessibilityRole="link" accessibilityLabel="Read policy" onPress={() => router.push('/terms')}>
                <Text style={styles.policyLink}>Read policy</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 10 }]}>
            <View style={styles.footerTop}>
              <Text style={styles.footerSubtotal}>Subtotal: {formatRupee(payable)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="View bill and savings" onPress={showBill}>
                <Text style={styles.footerLink}>VIEW BILL & SAVINGS</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${addressLabel}. ${address}`}
              onPress={openLocation}
              style={styles.addressRow}>
              <View style={styles.addressCopy}>
                <Text style={styles.addressTitle}>{addressLabel}</Text>
                <Text numberOfLines={1} style={styles.addressLine}>
                  {address}
                </Text>
              </View>
              <View style={styles.homeBadge}>
                <AppIcon name="homeFocused" color={colors.text} size={16} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={UI_PREVIEW_MODE && confirmed ? 'Continue preview checkout' : 'Select delivery option'}
              onPress={() => {
                if (UI_PREVIEW_MODE && confirmed) {
                  router.push('/checkout');
                  return;
                }
                openLocation();
              }}
              style={({ pressed }) => [styles.deliveryButton, pressed && styles.pressed]}>
              <Text style={styles.deliveryLabel}>
                {UI_PREVIEW_MODE && confirmed ? 'CONTINUE PREVIEW CHECKOUT' : 'SELECT DELIVERY OPTION'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

function BillRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.billRow} accessibilityLabel={hint ? `${label} ${value}. ${hint}` : `${label} ${value}`}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={styles.billValue}>{value}</Text>
    </View>
  );
}

function PolicyCard({ icon, text }: { icon: 'clock' | 'shield'; text: string }) {
  return (
    <View style={styles.policy}>
      <View style={styles.policyIcon}>
        <AppIcon name={icon} color={colors.primaryInk} size={16} />
      </View>
      <Text style={styles.policyText}>{text}</Text>
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
    paddingHorizontal: 8,
    paddingBottom: 12,
    gap: 4,
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconSurface,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
    gap: 10,
  },
  savings: {
    backgroundColor: colors.softYellow,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  savingsLeft: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  savingsRight: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.primaryInk,
    textAlign: 'right',
  },
  card: {
    marginHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionCopy: {
    flex: 1,
    gap: 1,
  },
  item: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.softBackground,
  },
  missingImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.softBackground,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  itemUnit: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  stepper: {
    alignSelf: 'flex-start',
    marginTop: 6,
    minWidth: 92,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    minWidth: 16,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  remove: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  removeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.danger,
  },
  door: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  doorCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 28,
  },
  billLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  billValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  subtotal: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: colors.cream,
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  subtotalValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  policy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.softBackground,
    borderRadius: 12,
    padding: 12,
  },
  policyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.iconBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  policyNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  policyLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerSubtotal: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressCopy: {
    flex: 1,
    minWidth: 0,
  },
  addressTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  addressLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  homeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    letterSpacing: 0.3,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  emptyCopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
