import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CHECKOUT_PAYMENT_METHODS,
  getCheckoutPaymentMethod,
  resolveCheckoutPaymentMethodId,
  type CheckoutPaymentMethodId,
} from '@/components/payment/checkoutPaymentMethods';
import { PaymentMethodSelectCard } from '@/components/payment/PaymentMethodSelectCard';
import { PaymentOrderSummary } from '@/components/payment/PaymentOrderSummary';
import { PaymentStepIndicator } from '@/components/payment/PaymentStepIndicator';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { computeDemoCouponDiscount, demoCouponById, isCouponExpired } from '@/data/demoCoupons';
import { findDemoProduct } from '@/data/findDemoProduct';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { addressesSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { formatRupee } from '@/utils/cartBill';
import { isCompleteDeliveryLocation } from '@/utils/deliveryAddress';
import { buildDemoCheckoutBill, createDemoOrderId } from '@/utils/demoCheckoutBill';

type ActionError = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);

  const { quantities, setQuantity } = useMockCart();
  const { confirmed, beginAddressBookPick } = useDeliveryLocation();
  const { addresses, hydrated } = useSavedAddresses();
  const { couponId, placeOrder } = usePreviewSession();
  const params = useLocalSearchParams<{ method?: string | string[] }>();

  const initialMethod = useMemo(() => resolveCheckoutPaymentMethodId(params.method), [params.method]);
  const [methodId, setMethodId] = useState<CheckoutPaymentMethodId>(initialMethod);
  const [billExpanded, setBillExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    setMethodId(initialMethod);
  }, [initialMethod]);

  const lines = useMemo(
    () =>
      Object.entries(quantities)
        .map(([id, quantity]) => {
          const product = findDemoProduct(id);
          return product ? { product, quantity } : null;
        })
        .filter(
          (line): line is { product: NonNullable<ReturnType<typeof findDemoProduct>>; quantity: number } =>
            line !== null,
        ),
    [quantities],
  );

  const foundCoupon = UI_PREVIEW_MODE ? demoCouponById(couponId) : undefined;
  const coupon = foundCoupon && !isCouponExpired(foundCoupon) ? foundCoupon : undefined;
  const provisional = buildDemoCheckoutBill(lines, 0);
  const couponOff = coupon ? computeDemoCouponDiscount(coupon, provisional.itemTotal) : 0;
  const bill = buildDemoCheckoutBill(lines, couponOff);
  const method = getCheckoutPaymentMethod(methodId);

  const complete = isCompleteDeliveryLocation(confirmed);
  const addressLine = complete && confirmed ? formatDeliveryAddress(confirmed) : null;
  const addressLabel = confirmed?.label?.trim()
    ? `Delivery to ${confirmed.label}`
    : 'Delivery address';

  const openAddressFlow = useCallback(() => {
    if (hydrated && addresses.length > 0) {
      beginAddressBookPick({ selectMode: true, returnTo: '/payment' });
      router.push(addressesSelectHref());
      return;
    }
    beginAddressBookPick({ selectMode: true, returnTo: '/payment' });
    router.push(locationRoutes.search);
  }, [addresses.length, beginAddressBookPick, hydrated]);

  const selectMethod = useCallback((id: CheckoutPaymentMethodId) => {
    setMethodId(id);
    setActionError(null);
    router.setParams({ method: id });
  }, []);

  const placeDemoCodOrder = useCallback(() => {
    if (submitLock.current || submitting) {
      return;
    }
    if (!UI_PREVIEW_MODE) {
      setActionError({
        title: 'Payment unavailable',
        body: 'Live payment is not connected yet. No charge was made.',
      });
      return;
    }
    if (lines.length === 0) {
      setActionError({
        title: 'Cart is empty',
        body: 'Add items from the shop before placing an order.',
        actionLabel: 'Browse shop',
        onAction: () => router.replace('/shop'),
      });
      return;
    }
    if (!complete) {
      setActionError({
        title: 'Address required',
        body: 'Add a complete delivery address with city and PIN before placing the order.',
        actionLabel: 'Add address',
        onAction: openAddressFlow,
      });
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setActionError(null);

    try {
      const id = createDemoOrderId();
      placeOrder({
        id,
        placedAtLabel: 'Just now · demo',
        status: 'confirmed',
        statusDetail: 'Demo confirmation. This order was not sent to a store or payment provider.',
        statusAt: {
          placed: 'Just now',
          confirmed: 'Just now',
        },
        addressTitle: confirmed?.label ? `Delivery to ${confirmed.label}` : 'Delivery address',
        addressLine: confirmed ? formatDeliveryAddress(confirmed) : 'No address selected',
        items: lines.map((line) => ({
          id: line.product.id,
          name: line.product.name,
          quantity: line.quantity,
          unit: line.product.unit,
        })),
        totalAmount: bill.grandTotal,
        total: bill.grandTotal,
        paymentLabel: `Demo · ${method.title}`,
        partner: { name: 'Demo Partner', status: 'Assigned (preview)' },
      });
      for (const line of lines) {
        setQuantity(line.product.id, 0);
      }
      router.replace({ pathname: '/order-confirmed', params: { id } });
    } catch {
      submitLock.current = false;
      setSubmitting(false);
      setActionError({
        title: 'Could not place order',
        body: 'Something went wrong while saving the demo order. Please try again.',
        actionLabel: 'Retry',
        onAction: () => {
          setActionError(null);
        },
      });
    }
  }, [
    bill.grandTotal,
    complete,
    confirmed,
    lines,
    method.title,
    openAddressFlow,
    placeOrder,
    setQuantity,
    submitting,
  ]);

  const onPrimaryAction = useCallback(() => {
    if (method.canPlaceDemoOrder) {
      placeDemoCodOrder();
      return;
    }
    setActionError({
      title: 'Secure payment not connected',
      body: `${method.title} needs a real payment gateway. No charge was made and no order was placed. Choose Cash on Delivery for the demo checkout, or connect a provider later.`,
      actionLabel: 'Use Cash on Delivery',
      onAction: () => {
        selectMethod('cod');
      },
    });
  }, [method.canPlaceDemoOrder, method.title, placeDemoCodOrder, selectMethod]);

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Payment"
        message="Payment is not connected yet. No charge will be made."
        withHeader
      />
    );
  }

  const ctaLabel = !complete
    ? 'Add address to continue'
    : method.canPlaceDemoOrder
      ? 'Place Order'
      : 'Proceed to Secure Payment';
  const footerEnabled = !submitting && lines.length > 0;

  const showEmptyCart = lines.length === 0;

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Payment" fallbackHref="/checkout" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {showEmptyCart ? (
          <View style={styles.empty}>
            <SoftIcon name="basket" size={56} />
            <Text style={styles.emptyTitle}>Nothing to pay for</Text>
            <Text style={styles.emptyCopy}>Your cart is empty. Add items, then return through checkout.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse the shop"
              onPress={() => router.replace('/shop')}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
              <Text style={styles.emptyButtonLabel}>Browse shop</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.content, { width: contentWidth, paddingBottom: 24 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.pageSubtitle}>Choose how you'd like to pay</Text>
              <PaymentStepIndicator activeIndex={2} />

              <DemoBanner message="Simulation only — banks and gateways are not contacted." />

              <PaymentOrderSummary
                addressLabel={addressLabel}
                addressLine={addressLine}
                itemCount={bill.itemCount}
                bill={bill}
                expanded={billExpanded}
                onToggleExpand={() => setBillExpanded((value) => !value)}
                onChangeAddress={openAddressFlow}
              />

              {!complete ? (
                <View style={styles.alert}>
                  <AppIcon name="info" color={colors.danger} size={18} />
                  <View style={styles.alertCopy}>
                    <Text style={styles.alertTitle}>Delivery address needed</Text>
                    <Text style={styles.alertBody}>
                      A house-level address with city and PIN is required before you can place an order.
                    </Text>
                    <Pressable accessibilityRole="button" onPress={openAddressFlow}>
                      <Text style={styles.alertLink}>Add delivery address</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment method</Text>
                <Text style={styles.sectionSub}>Select one option. Online methods stay unavailable until a gateway is connected.</Text>
                <View style={styles.methodList}>
                  {CHECKOUT_PAYMENT_METHODS.map((option) => (
                    <PaymentMethodSelectCard
                      key={option.id}
                      method={option}
                      selected={option.id === methodId}
                      onSelect={() => selectMethod(option.id)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.detailCard}>
                {method.id === 'cod' ? (
                  <>
                    <Text style={styles.detailTitle}>Pay on delivery</Text>
                    <Text style={styles.detailBody}>
                      Keep {formatRupee(bill.grandTotal)} ready for the delivery partner. This preview places a
                      simulated order only — nothing is sent to a store.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.detailTitle}>{method.title}</Text>
                    <Text style={styles.detailBody}>
                      A secure payment provider is not connected in this build. Selecting this method will not
                      collect card or UPI details, will not charge you, and will not mark payment as successful.
                    </Text>
                  </>
                )}
              </View>

              {actionError ? (
                <View style={styles.errorCard} accessibilityRole="alert">
                  <Text style={styles.errorTitle}>{actionError.title}</Text>
                  <Text style={styles.errorBody}>{actionError.body}</Text>
                  {actionError.actionLabel && actionError.onAction ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={actionError.onAction}
                      style={({ pressed }) => [styles.errorAction, pressed && styles.pressed]}>
                      <Text style={styles.errorActionLabel}>{actionError.actionLabel}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.footerTotal}>
                <Text style={styles.footerCaption}>To pay</Text>
                <Text style={styles.footerAmount}>{formatRupee(bill.grandTotal)}</Text>
              </View>
              <View style={styles.footerAction}>
                <PrimaryButton
                  label={ctaLabel}
                  accessibilityLabel={`${ctaLabel} · ${formatRupee(bill.grandTotal)}`}
                  disabled={!footerEnabled}
                  loading={submitting}
                  showArrow={complete}
                  onPress={() => {
                    if (!complete) {
                      openAddressFlow();
                      return;
                    }
                    onPrimaryAction();
                  }}
                />
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
    gap: 12,
  },
  pageSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  methodList: {
    gap: 10,
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    gap: 6,
    ...shadow.soft,
  },
  detailTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  detailBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  alert: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: '#FEF2F2',
  },
  alertCopy: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.danger,
  },
  alertBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  alertLink: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.danger,
  },
  errorBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  errorAction: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorActionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
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
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
