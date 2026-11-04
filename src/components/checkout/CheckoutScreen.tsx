import { Redirect, router, useIsFocused } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import {
  CHECKOUT_PAYMENT_METHODS,
  type CheckoutPaymentMethodId,
} from '@/components/payment/checkoutPaymentMethods';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { computeDemoCouponDiscount, demoCouponById, isCouponExpired } from '@/data/demoCoupons';
import { findDemoProduct } from '@/data/findDemoProduct';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { addressesSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import type { DemoProduct } from '@/types/catalog';
import { formatRupee } from '@/utils/cartBill';
import { isCompleteDeliveryLocation } from '@/utils/deliveryAddress';
import { buildDemoCheckoutBill } from '@/utils/demoCheckoutBill';

type KnownLine = { id: string; quantity: number; product: DemoProduct };
type MissingLine = { id: string; quantity: number; product: null };
type CheckoutLine = KnownLine | MissingLine;

export function CheckoutScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);

  const { quantities, leaveAtDoor, setQuantity, setLeaveAtDoor } = useMockCart();
  const { confirmed, beginAddressBookPick } = useDeliveryLocation();
  const { addresses, hydrated } = useSavedAddresses();
  const { couponId, setCouponId } = usePreviewSession();
  const { profile } = useCustomerProfile();
  const { hydrated: authHydrated, session, devSession } = useAuthSession();

  const [instructions, setInstructions] = useState('');
  const [methodId, setMethodId] = useState<CheckoutPaymentMethodId>('cod');
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  const lines = useMemo(
    () =>
      Object.entries(quantities).map(([id, quantity]): CheckoutLine => {
        const product = findDemoProduct(id);
        return product ? { id, quantity, product } : { id, quantity, product: null };
      }),
    [quantities],
  );
  const known = lines.filter((line): line is KnownLine => line.product !== null);
  const missing = lines.filter((line): line is MissingLine => line.product === null);

  const coupon =
    UI_PREVIEW_MODE && couponId
      ? (() => {
          const found = demoCouponById(couponId);
          return found && !isCouponExpired(found) ? found : undefined;
        })()
      : undefined;

  const provisional = buildDemoCheckoutBill(
    known.map((line) => ({ product: line.product, quantity: line.quantity })),
    0,
  );
  const couponOff = coupon ? computeDemoCouponDiscount(coupon, provisional.itemTotal) : 0;
  const bill = buildDemoCheckoutBill(
    known.map((line) => ({ product: line.product, quantity: line.quantity })),
    couponOff,
  );

  const complete = isCompleteDeliveryLocation(confirmed);
  const addressLine = complete && confirmed ? formatDeliveryAddress(confirmed) : null;
  const addressLabel = confirmed?.label?.trim() || 'Address';
  const customerName = profile?.name?.trim() || session?.name?.trim() || 'Guest';
  const customerPhone = profile?.mobile?.trim() || session?.mobile?.trim() || devSession?.mobile?.trim() || null;

  const canContinue = UI_PREVIEW_MODE && known.length > 0 && complete && !submitting;

  const openAddressFlow = useCallback(() => {
    beginAddressBookPick({ selectMode: true, returnTo: '/checkout' });
    if (hydrated && addresses.length > 0) {
      router.push(addressesSelectHref());
      return;
    }
    router.push(locationRoutes.search);
  }, [addresses.length, beginAddressBookPick, hydrated]);

  const continueToPayment = useCallback(() => {
    if (submitLock.current || submitting) {
      return;
    }
    if (!complete) {
      openAddressFlow();
      return;
    }
    if (known.length === 0) {
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    router.push({ pathname: '/payment', params: { method: methodId } });
    // Unlock shortly so returning from payment can try again.
    setTimeout(() => {
      submitLock.current = false;
      setSubmitting(false);
    }, 800);
  }, [complete, known.length, methodId, openAddressFlow, submitting]);

  if (authHydrated && focused && !session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Checkout" message="Checkout is not connected yet." withHeader />;
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Checkout" fallbackHref="/cart" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {lines.length === 0 ? (
          <View style={styles.empty}>
            <SoftIcon name="basket" size={56} />
            <Text style={styles.emptyTitle}>Nothing to checkout</Text>
            <Text style={styles.emptyCopy}>Add items from the shop, then return here to review delivery and payment.</Text>
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
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                {
                  width: contentWidth,
                  paddingBottom: 24,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <DemoBanner message="Simulated checkout — payment providers are not contacted." />

              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionIcon}>
                    <AppIcon name="stores" color={colors.primaryInk} size={18} />
                  </View>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.cardTitle}>Delivery address</Text>
                    <Text style={styles.cardSub}>
                      {complete ? 'Orders ship to this address' : 'A complete address is required'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={complete ? 'Change address' : 'Add delivery address'}
                    hitSlop={8}
                    onPress={openAddressFlow}
                    style={({ pressed }) => [styles.changeChip, pressed && styles.pressed]}>
                    <Text style={styles.changeChipLabel}>{complete ? 'Change' : 'Add'}</Text>
                  </Pressable>
                </View>

                {complete && addressLine ? (
                  <View style={styles.addressBody}>
                    <View style={styles.labelRow}>
                      <View style={styles.labelBadge}>
                        <AppIcon
                          name={addressLabel.toLowerCase() === 'work' ? 'briefcase' : 'homeFocused'}
                          color={colors.text}
                          size={14}
                        />
                        <Text style={styles.labelBadgeText}>{addressLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.customerName}>{customerName}</Text>
                    <Text style={styles.addressText}>{addressLine}</Text>
                    {customerPhone ? (
                      <View style={styles.phoneRow}>
                        <AppIcon name="phone" color={colors.textSecondary} size={14} />
                        <Text style={styles.phoneText}>{customerPhone}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.missingAddress}>
                    <Text style={styles.hint}>
                      Add a house-level address with city and PIN before continuing to payment.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add delivery address"
                      onPress={openAddressFlow}
                      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                      <Text style={styles.secondaryButtonLabel}>Select delivery address</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionIcon}>
                    <AppIcon name="truck" color={colors.primaryInk} size={18} />
                  </View>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.cardTitle}>Delivery information</Text>
                    <Text style={styles.cardSub}>Timing is confirmed after the store accepts the order</Text>
                  </View>
                </View>
                <TextInput
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="Delivery instructions (optional, demo only)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={styles.input}
                  accessibilityLabel="Delivery instructions"
                />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: leaveAtDoor }}
                  accessibilityLabel="Leave the order at door or gate"
                  onPress={() => setLeaveAtDoor(!leaveAtDoor)}
                  style={styles.doorRow}>
                  <View style={styles.doorCopy}>
                    <Text style={styles.doorTitle}>Leave at door or gate</Text>
                    <Text style={styles.cardSub}>No-contact preference for the delivery partner (demo).</Text>
                  </View>
                  <View style={[styles.checkbox, leaveAtDoor && styles.checkboxOn]}>
                    {leaveAtDoor ? <AppIcon name="check" color={colors.text} size={14} /> : null}
                  </View>
                </Pressable>
              </View>

              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <SoftIcon name="basket" size={26} />
                  <View style={styles.sectionCopy}>
                    <Text style={styles.cardTitle}>Order items</Text>
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

                {missing.map((line) => (
                  <View key={line.id} style={styles.item}>
                    <View style={styles.missingImage} />
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName}>Item unavailable</Text>
                      <Text style={styles.cardSub}>Not in the catalogue — excluded from the total.</Text>
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

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment method</Text>
                <Text style={styles.cardSub}>Demo methods only — no bank or gateway is contacted.</Text>
                {CHECKOUT_PAYMENT_METHODS.map((option) => {
                  const selected = option.id === methodId;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setMethodId(option.id)}
                      style={[styles.paymentRow, selected && styles.paymentRowOn]}>
                      <View style={styles.paymentIcon}>
                        <AppIcon name={option.icon} color={colors.text} size={18} />
                      </View>
                      <View style={styles.paymentCopy}>
                        <Text style={styles.paymentLabel}>{option.title}</Text>
                        <Text style={styles.cardSub}>
                          {option.demoBadge ? `${option.subtitle} · ${option.demoBadge}` : option.subtitle}
                        </Text>
                      </View>
                      <View style={[styles.radio, selected && styles.radioOn]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.card, styles.couponRow]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={coupon ? `Coupon ${coupon.title}. Change coupon` : 'Apply coupon'}
                  onPress={() => router.push('/coupons')}
                  style={({ pressed }) => [styles.couponMain, pressed && styles.pressed]}>
                  <SoftIcon name="coupon" size={28} />
                  <View style={styles.couponCopy}>
                    <Text style={styles.cardTitle}>{coupon ? coupon.title : 'Apply coupon'}</Text>
                    <Text style={styles.cardSub}>
                      {coupon
                        ? `Saving ${formatRupee(bill.discount)} · simulated, not a live offer`
                        : 'Preview coupons only. Nothing is redeemed.'}
                    </Text>
                  </View>
                  {coupon ? null : <AppIcon name="chevron" color={colors.textSecondary} size={18} />}
                </Pressable>
                {coupon ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove coupon"
                    hitSlop={8}
                    onPress={() => setCouponId(null)}
                    style={styles.removeCoupon}>
                    <Text style={styles.removeLabel}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bill details</Text>
                <BillRow label="Item total" value={formatRupee(bill.itemTotal)} />
                {bill.savings > 0 ? (
                  <BillRow label="Product discount" value={`-${formatRupee(bill.savings)}`} emphasize />
                ) : null}
                <BillRow
                  label="Delivery fee"
                  value={formatRupee(bill.deliveryFee)}
                  hint="Demo fee for preview checkout only"
                />
                {bill.handlingFee > 0 ? (
                  <BillRow label="Handling fee" value={formatRupee(bill.handlingFee)} />
                ) : null}
                {bill.discount > 0 ? (
                  <BillRow label="Coupon discount" value={`-${formatRupee(bill.discount)}`} emphasize />
                ) : null}
                <View style={styles.grandTotal}>
                  <Text style={styles.grandLabel}>Grand total</Text>
                  <Text style={styles.grandValue}>{formatRupee(bill.grandTotal)}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.footerTotal}>
                <Text style={styles.footerCaption}>To pay</Text>
                <Text style={styles.footerAmount}>{formatRupee(bill.grandTotal)}</Text>
              </View>
              <View style={styles.footerAction}>
                <PrimaryButton
                  label={complete ? 'Continue to Payment' : 'Add address to continue'}
                  accessibilityLabel={
                    complete
                      ? `Continue to Payment · ${formatRupee(bill.grandTotal)}`
                      : 'Add delivery address to continue'
                  }
                  disabled={!canContinue && complete}
                  loading={submitting}
                  showArrow={complete}
                  onPress={continueToPayment}
                />
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function BillRow({
  label,
  value,
  hint,
  emphasize = false,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <View
      style={styles.billRow}
      accessibilityLabel={hint ? `${label} ${value}. ${hint}` : `${label} ${value}`}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, emphasize && styles.billEmphasize]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.sm,
    gap: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    gap: 10,
    ...shadow.soft,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
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
  changeChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeChipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  addressBody: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  labelBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  customerName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  addressText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  phoneText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  missingAddress: {
    gap: 10,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  input: {
    minHeight: 72,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  doorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 44,
  },
  doorCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  doorTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
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
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
  },
  paymentRowOn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  paymentLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.primaryDark,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryDark,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  removeCoupon: {
    paddingVertical: 4,
    paddingHorizontal: 4,
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
  billEmphasize: {
    color: colors.success,
  },
  grandTotal: {
    marginTop: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.cream,
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  grandValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.soft,
  },
  footerTotal: {
    gap: 2,
    minWidth: 72,
  },
  footerCaption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  footerAmount: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  footerAction: {
    flex: 1,
    minWidth: 0,
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
