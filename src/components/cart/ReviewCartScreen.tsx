import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { BRAND_NAME } from '@/constants/brand';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { addressesSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import { useToast } from '@/components/ui/AppToast';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { useSavedCarts } from '@/context/SavedCartsContext';
import { computeDemoCouponDiscount, demoCouponById, isCouponExpired } from '@/data/demoCoupons';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { isProductInStock } from '@/data/resolveWishlistProducts';
import { useResolvedCartLines } from '@/hooks/useResolvedCartLines';
import { isCompleteDeliveryLocation } from '@/utils/deliveryAddress';
import { buildCartBill, formatRupee, type CartLine } from '@/utils/cartBill';

export function ReviewCartScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<{ scrollTo: (options: { y: number; animated?: boolean }) => void } | null>(null);
  const billOffset = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  // Cart tab always shows the persistent basket — never Buy Now session lines.
  const { showToast } = useToast();
  const { hydrated: cartHydrated, quantities, leaveAtDoor, setQuantity, setLeaveAtDoor, clearBuyNow, clearCart } =
    useMockCart();
  const { lines, known, missing, catalogReady } = useResolvedCartLines();
  const { couponId } = usePreviewSession();
  const { confirmed, beginAddressBookPick, beginLocationEdit } = useDeliveryLocation();
  const { addresses, hydrated } = useSavedAddresses();
  const { saveCurrentCart } = useSavedCarts();
  const inStockKnown = known.filter((line) => isProductInStock(line.product));
  const outOfStockKnown = known.filter((line) => !isProductInStock(line.product));
  const bill = buildCartBill(
    inStockKnown.map((line) => ({ product: line.product, quantity: line.quantity }) satisfies CartLine),
  );

  function confirmClearCart() {
    Alert.alert('Clear cart?', 'Remove all items from your cart on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear cart',
        style: 'destructive',
        onPress: () => {
          clearCart();
          clearBuyNow();
        },
      },
    ]);
  }

  function openSaveCart() {
    setSaveName('My cart');
    setSaveOpen(true);
  }

  function commitSaveCart() {
    const saved = saveCurrentCart(saveName, quantities);
    if (!saved) {
      showToast('error', 'Could not save. Enter a name and keep at least one item.');
      return;
    }
    setSaveOpen(false);
    setSaveName('');
    showToast('success', `Saved “${saved.name}” on this device.`);
  }
  const foundCoupon = UI_PREVIEW_MODE ? demoCouponById(couponId) : undefined;
  const coupon = foundCoupon && !isCouponExpired(foundCoupon) ? foundCoupon : undefined;
  const couponOff = coupon ? computeDemoCouponDiscount(coupon, bill.itemTotal) : 0;
  const payable = Math.max(0, bill.subtotal - couponOff);
  const hasComplete = isCompleteDeliveryLocation(confirmed);
  const address = hasComplete && confirmed ? formatDeliveryAddress(confirmed) : 'Select delivery location';
  const addressLabel = hasComplete && confirmed?.label ? `Delivery to ${confirmed.label.toUpperCase()}` : 'Delivery address';

  function openLocation() {
    if (hydrated && addresses.length > 0) {
      beginAddressBookPick({ selectMode: true, returnTo: '/cart' });
      router.push(addressesSelectHref());
      return;
    }
    // Change-location only — Set Location must return to Cart, not reopen search.
    beginLocationEdit('change', { returnTo: '/cart' });
    router.push(locationRoutes.search);
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
          <AppIcon name="back" color={colors.text} size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Review Cart</Text>
          <Text style={styles.headerSubtitle}>{BRAND_NAME}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
          onPress={() => router.push(profileRoutes.profile)}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <AppIcon name="profile" color={colors.white} size={24} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          accessibilityState={{ expanded: menuOpen }}
          hitSlop={8}
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <AppIcon name="menu" color={colors.white} size={24} />
        </Pressable>
      </View>

      {!cartHydrated ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primaryInk} />
          <Text style={styles.emptyTitle}>Loading cart</Text>
          <Text style={styles.emptyCopy}>Restoring items saved on this device…</Text>
        </View>
      ) : lines.length === 0 ? (
        <View style={styles.empty}>
          <SoftIcon name="basket" size={56} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCopy}>Add items from the shop. Your cart is saved on this device for your account.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse the shop"
            onPress={() => router.push('/shop')}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
            <Text style={styles.emptyButtonLabel}>Browse shop</Text>
          </Pressable>
        </View>
      ) : !catalogReady && known.length === 0 ? (
        <View style={styles.empty}>
          <SoftIcon name="basket" size={56} />
          <Text style={styles.emptyTitle}>Loading cart</Text>
          <Text style={styles.emptyCopy}>Fetching products from the catalogue…</Text>
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
                    {outOfStockKnown.length + missing.length > 0
                      ? ` · ${outOfStockKnown.length + missing.length} unavailable`
                      : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save cart"
                  hitSlop={8}
                  onPress={openSaveCart}
                  style={({ pressed }) => [styles.clearCartBtn, pressed && styles.pressed]}>
                  <Text style={styles.saveCartLabel}>Save</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear cart"
                  hitSlop={8}
                  onPress={confirmClearCart}
                  style={({ pressed }) => [styles.clearCartBtn, pressed && styles.pressed]}>
                  <Text style={styles.clearCartLabel}>Clear</Text>
                </Pressable>
              </View>
              {saveOpen ? (
                <View style={styles.saveRow}>
                  <TextInput
                    value={saveName}
                    onChangeText={setSaveName}
                    placeholder="Cart name"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.saveInput}
                    maxLength={60}
                    accessibilityLabel="Saved cart name"
                    autoFocus
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Confirm save cart"
                    onPress={commitSaveCart}
                    style={({ pressed }) => [styles.saveConfirm, pressed && styles.pressed]}>
                    <Text style={styles.saveConfirmLabel}>OK</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel save cart"
                    onPress={() => setSaveOpen(false)}>
                    <Text style={styles.clearCartLabel}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open saved carts"
                  onPress={() => router.push(profileRoutes.savedCarts)}
                  style={styles.savedLink}>
                  <Text style={styles.savedLinkLabel}>View saved carts</Text>
                </Pressable>
              )}
              {inStockKnown.map((line) => (
                <View key={line.id} style={styles.item}>
                  <CatalogImage
                    source={line.product.image}
                    style={styles.itemImage}
                    label={line.product.name}
                    identityKey={line.product.id}
                  />
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
                        hitSlop={10}
                        onPress={() => setQuantity(line.id, line.quantity - 1)}
                        style={styles.stepButton}>
                        <AppIcon name="minus" color={colors.text} size={18} />
                      </Pressable>
                      <Text style={styles.stepCount}>{line.quantity}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Increase ${line.product.name}`}
                        hitSlop={10}
                        onPress={() => setQuantity(line.id, line.quantity + 1)}
                        style={styles.stepButton}>
                        <AppIcon name="plus" color={colors.text} size={18} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
              {outOfStockKnown.map((line) => (
                <View key={line.id} style={styles.item}>
                  <CatalogImage
                    source={line.product.image}
                    style={styles.itemImage}
                    label={line.product.name}
                    identityKey={line.product.id}
                  />
                  <View style={styles.itemBody}>
                    <Text numberOfLines={2} style={styles.itemName}>
                      {line.product.name}
                    </Text>
                    <Text style={styles.cardSub}>Out of stock — not included in the local subtotal.</Text>
                    <View style={styles.stepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease ${line.product.name}`}
                        hitSlop={10}
                        onPress={() => setQuantity(line.id, line.quantity - 1)}
                        style={styles.stepButton}>
                        <AppIcon name="minus" color={colors.text} size={18} />
                      </Pressable>
                      <Text style={styles.stepCount}>{line.quantity}</Text>
                      <View style={styles.stepButton} accessibilityElementsHidden>
                        <AppIcon name="plus" color={colors.border} size={18} />
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove out of stock ${line.product.name}`}
                      onPress={() => setQuantity(line.id, 0)}
                      style={styles.remove}>
                      <Text style={styles.removeLabel}>Remove</Text>
                    </Pressable>
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
              <Text style={styles.localBillNote}>
                Local subtotal uses catalogue prices on this device. It is not a server-confirmed payable amount.
              </Text>
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

          <View style={styles.footer}>
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
            {!UI_PREVIEW_MODE ? (
              <View style={styles.unavailableBlock}>
                <Text style={styles.unavailableTitle}>Checkout not connected</Text>
                <Text style={styles.unavailableBody}>
                  Live checkout and payment are not available yet. Your cart stays saved on this device — no order
                  is placed and no payment is taken from here.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose or update delivery address"
                  onPress={openLocation}
                  style={({ pressed }) => [styles.secondaryDeliveryButton, pressed && styles.pressed]}>
                  <Text style={styles.secondaryDeliveryLabel}>
                    {confirmed ? 'UPDATE DELIVERY ADDRESS' : 'SELECT DELIVERY ADDRESS'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue shopping"
                  onPress={() => router.push('/shop')}
                  style={({ pressed }) => [styles.deliveryButton, pressed && styles.pressed]}>
                  <Text style={styles.deliveryLabel}>CONTINUE SHOPPING</Text>
                </Pressable>
              </View>
            ) : inStockKnown.length === 0 ? (
              <View style={styles.unavailableBlock}>
                <Text style={styles.unavailableTitle}>No available items</Text>
                <Text style={styles.unavailableBody}>
                  Remove out-of-stock or unavailable products, or add in-stock items before continuing.
                </Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={confirmed ? 'Continue preview checkout' : 'Select delivery option'}
                onPress={() => {
                  if (confirmed) {
                    // Explicit CART_CHECKOUT — drop any leftover Buy Now session.
                    clearBuyNow();
                    router.push({
                      pathname: '/checkout',
                      params: { checkoutMode: 'CART_CHECKOUT' },
                    });
                    return;
                  }
                  openLocation();
                }}
                style={({ pressed }) => [styles.deliveryButton, pressed && styles.pressed]}>
                <Text style={styles.deliveryLabel}>
                  {confirmed ? 'CONTINUE PREVIEW CHECKOUT' : 'SELECT DELIVERY OPTION'}
                </Text>
              </Pressable>
            )}
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
    backgroundColor: colors.warmBackground,
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  clearCartBtn: {
    minHeight: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCartLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  saveCartLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.softBackground,
  },
  saveConfirm: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveConfirmLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  savedLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  savedLinkLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  localBillNote: {
    marginTop: 8,
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
    paddingBottom: 10,
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
  unavailableBlock: {
    gap: 10,
  },
  unavailableTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  unavailableBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  secondaryDeliveryButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryDeliveryLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
    letterSpacing: 0.2,
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
