import { Redirect, router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
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
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { CASHFREE_IS_SANDBOX } from '@/constants/cashfree';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { computeDemoCouponDiscount, demoCouponById, isCouponExpired } from '@/data/demoCoupons';
import { useCheckoutLines } from '@/hooks/useResolvedCartLines';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { addressesSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { createCashfreePaymentOrder, verifyCashfreePayment } from '@/services/paymentsApi';
import {
  activateDevicePendingPaymentStore,
  clearPendingPayment,
  savePendingPayment,
} from '@/services/pendingPaymentStore';
import { formatRupee } from '@/utils/cartBill';
import { isCompleteDeliveryLocation } from '@/utils/deliveryAddress';
import { buildDemoCheckoutBill, createDemoOrderId } from '@/utils/demoCheckoutBill';
import { buildVerifiedCashfreeOrder } from '@/utils/finalizeVerifiedCashfreeOrder';

type ActionError = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

function buildSubmitToken(): string {
  return `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function PaymentScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);

  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const { profile } = useCustomerProfile();
  const { isBuyNow, clearBuyNow, clearCart } = useMockCart();
  const { known } = useCheckoutLines();
  const { confirmed, beginAddressBookPick } = useDeliveryLocation();
  const { addresses, hydrated } = useSavedAddresses();
  const { couponId, placeOrder, recordVerifiedPaidOrder } = usePreviewSession();
  const params = useLocalSearchParams<{ method?: string | string[] }>();

  const initialMethod = useMemo(() => resolveCheckoutPaymentMethodId(params.method), [params.method]);
  const [methodId, setMethodId] = useState<CheckoutPaymentMethodId>(initialMethod);
  const [seenInitialMethod, setSeenInitialMethod] = useState(initialMethod);
  if (initialMethod !== seenInitialMethod) {
    setSeenInitialMethod(initialMethod);
    setMethodId(initialMethod);
  }
  const [billExpanded, setBillExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingOnline, setProcessingOnline] = useState(false);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const submitLock = useRef(false);
  const activeOrderId = useRef<string | null>(null);

  const lines = useMemo(
    () => known.map((line) => ({ product: line.product, quantity: line.quantity })),
    [known],
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

  const customerPhone =
    profile?.mobile?.trim() || session?.mobile?.trim() || devSession?.mobile?.trim() || '';
  const customerName =
    profile?.name?.trim() || session?.name?.trim() || 'Mayapur Bazaar Customer';
  const customerEmail = profile?.email?.trim() || '';
  const customerId = session?.customerId?.trim() || customerPhone;

  const openAddressFlow = useCallback(() => {
    beginAddressBookPick({ selectMode: true, returnTo: '/payment' });
    if (hydrated && addresses.length > 0) {
      router.push(addressesSelectHref());
      return;
    }
    router.push(locationRoutes.search);
  }, [addresses.length, beginAddressBookPick, hydrated]);

  const selectMethod = useCallback((id: CheckoutPaymentMethodId) => {
    setMethodId(id);
    setActionError(null);
    router.setParams({ method: id });
  }, []);

  const finalizePaidOrder = useCallback(
    async (input: { orderId: string; amount: number; currency: string }) => {
      recordVerifiedPaidOrder(
        buildVerifiedCashfreeOrder({
          orderId: input.orderId,
          amount: input.amount,
          addressTitle: confirmed?.label ? `Delivery to ${confirmed.label}` : 'Delivery address',
          addressLine: confirmed ? formatDeliveryAddress(confirmed) : 'No address selected',
          items: lines.map((line) => ({
            id: line.product.id,
            name: line.product.name,
            quantity: line.quantity,
            unit: line.product.unit,
          })),
        }),
      );
      if (isBuyNow) {
        clearBuyNow();
      } else {
        clearCart();
      }
      await clearPendingPayment(input.orderId);
      router.replace({
        pathname: '/payment-success',
        params: {
          orderId: input.orderId,
          amount: String(input.amount),
          currency: input.currency,
          method: 'Cashfree',
        },
      });
    },
    [clearBuyNow, clearCart, confirmed, isBuyNow, lines, recordVerifiedPaidOrder],
  );

  const verifyAndRoute = useCallback(
    async (orderId: string) => {
      const verified = await verifyCashfreePayment(orderId);
      if (verified.isPaid) {
        await finalizePaidOrder({
          orderId: verified.orderId || orderId,
          amount: verified.amount ?? bill.grandTotal,
          currency: verified.currency ?? 'INR',
        });
        return;
      }
      router.replace({
        pathname: '/payment-pending',
        params: {
          orderId: verified.orderId || orderId,
          amount: String(verified.amount ?? bill.grandTotal),
          currency: verified.currency ?? 'INR',
          auto: '1',
        },
      });
    },
    [bill.grandTotal, finalizePaidOrder],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void activateDevicePendingPaymentStore();
    }
  }, []);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active' && activeOrderId.current && processingOnline) {
        void verifyAndRoute(activeOrderId.current);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [processingOnline, verifyAndRoute]);

  const placeDemoCodOrder = useCallback(() => {
    if (submitLock.current || submitting) {
      return;
    }
    if (!UI_PREVIEW_MODE) {
      setActionError({
        title: 'COD not connected live',
        body: 'Cash on Delivery needs the store place-order API. Use Online Payment (Cashfree), or enable UI preview for a simulated COD order.',
        actionLabel: 'Use Online Payment',
        onAction: () => selectMethod('online'),
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
      if (isBuyNow) {
        clearBuyNow();
      } else {
        clearCart();
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
    clearBuyNow,
    clearCart,
    complete,
    confirmed,
    isBuyNow,
    lines,
    method.title,
    openAddressFlow,
    placeOrder,
    selectMethod,
    submitting,
  ]);

  const startOnlinePayment = useCallback(async () => {
    if (submitLock.current || submitting) {
      return;
    }
    if (lines.length === 0) {
      setActionError({
        title: 'Cart is empty',
        body: 'Add items from the shop before paying.',
        actionLabel: 'Browse shop',
        onAction: () => router.replace('/shop'),
      });
      return;
    }
    if (!complete) {
      setActionError({
        title: 'Address required',
        body: 'Add a complete delivery address with city and PIN before paying.',
        actionLabel: 'Add address',
        onAction: openAddressFlow,
      });
      return;
    }
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      setActionError({
        title: 'Mobile required',
        body: 'Sign in with a valid Indian mobile number before starting Cashfree checkout.',
        actionLabel: 'Go to login',
        onAction: () => router.replace('/login'),
      });
      return;
    }
    if (bill.grandTotal <= 0) {
      setActionError({
        title: 'Invalid amount',
        body: 'Payable amount must be greater than zero.',
      });
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setProcessingOnline(true);
    setActionError(null);

    try {
      const created = await createCashfreePaymentOrder({
        CustomerId: customerId,
        CustomerName: customerName,
        CustomerEmail: customerEmail,
        CustomerPhone: customerPhone.replace(/\D/g, '').slice(-10),
        Amount: bill.grandTotal,
      });

      if (created.status !== 'Success') {
        submitLock.current = false;
        setSubmitting(false);
        setProcessingOnline(false);
        setActionError({
          title: 'Could not start payment',
          body: created.message,
          actionLabel: 'Try again',
          onAction: () => setActionError(null),
        });
        return;
      }

      activeOrderId.current = created.orderId;
      await savePendingPayment({
        orderId: created.orderId,
        paymentSessionId: created.paymentSessionId,
        amount: created.orderAmount,
        currency: created.currency,
        createdAt: Date.now(),
        customerPhone,
        addressTitle: addressLabel,
        addressLine: addressLine ?? '',
        itemSummary: lines.map((line) => ({
          id: line.product.id,
          name: line.product.name,
          quantity: line.quantity,
          unit: line.product.unit,
        })),
        submitToken: buildSubmitToken(),
      });

      // Official Cashfree session checkout WebView (Expo Go + slim download APK).
      // Never mark paid until VerifyPayment succeeds.
      submitLock.current = false;
      setSubmitting(false);
      setProcessingOnline(false);
      router.push({
        pathname: '/payment-checkout',
        params: {
          orderId: created.orderId,
          paymentSessionId: created.paymentSessionId,
          amount: String(created.orderAmount),
          currency: created.currency,
        },
      });
    } catch {
      submitLock.current = false;
      setSubmitting(false);
      setProcessingOnline(false);
      setActionError({
        title: 'Payment error',
        body: 'Something went wrong starting Cashfree checkout. No order was marked paid.',
      });
    }
  }, [
    addressLabel,
    addressLine,
    bill.grandTotal,
    complete,
    customerEmail,
    customerId,
    customerName,
    customerPhone,
    lines,
    openAddressFlow,
    submitting,
  ]);

  const onPrimaryAction = useCallback(() => {
    if (method.usesCashfree) {
      void startOnlinePayment();
      return;
    }
    if (method.canPlaceDemoOrder) {
      placeDemoCodOrder();
      return;
    }
    setActionError({
      title: 'Payment method unavailable',
      body: 'Choose Cash on Delivery or Online Payment.',
    });
  }, [method.canPlaceDemoOrder, method.usesCashfree, placeDemoCodOrder, startOnlinePayment]);

  if (authHydrated && focused && !session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  const ctaLabel = !complete
    ? 'Add address to continue'
    : method.usesCashfree
      ? processingOnline
        ? 'Processing payment…'
        : 'Pay Securely'
      : method.canPlaceDemoOrder
        ? 'Place Order'
        : 'Continue';
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
              {UI_PREVIEW_MODE ? (
                <DemoBanner message="COD is simulated in preview. Online Payment uses the live Cashfree sandbox via backend APIs." />
              ) : (
                <View style={styles.liveBanner}>
                  <AppIcon name="lock" color={colors.primaryInk} size={16} />
                  <Text style={styles.liveBannerText}>
                    Online payments use Cashfree ({CASHFREE_IS_SANDBOX ? 'sandbox' : 'production'}). Success only
                    after server verification.
                  </Text>
                </View>
              )}

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
                <Text style={styles.sectionSub}>
                  Choose Cash on Delivery or pay online. Cashfree checkout includes UPI, cards, and net banking.
                </Text>
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
                      Keep {formatRupee(bill.grandTotal)} ready for the delivery partner.
                      {UI_PREVIEW_MODE
                        ? ' This preview places a simulated order only — nothing is sent to a store.'
                        : ' Live COD place-order is not published on the API yet — use Online Payment for paid checkout.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.detailTitle}>Cashfree secure checkout</Text>
                    <Text style={styles.detailBody}>
                      We create a payment session on Mayapur Bazaar servers, open Cashfree checkout, then verify
                      payment status before confirming. Client callbacks alone never mark an order paid.
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
                  showArrow={complete && !processingOnline}
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
  liveBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: colors.softYellow,
    borderRadius: radii.md,
    padding: 12,
  },
  liveBannerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
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
