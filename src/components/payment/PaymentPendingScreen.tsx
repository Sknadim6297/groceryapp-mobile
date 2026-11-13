import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { clearPendingPayment, loadPendingPayment } from '@/services/pendingPaymentStore';
import { verifyCashfreePayment } from '@/services/paymentsApi';
import { formatRupee } from '@/utils/cartBill';
import { buildVerifiedCashfreeOrder } from '@/utils/finalizeVerifiedCashfreeOrder';
import {
  nextPaymentPollDelayMs,
  paymentOutcomeBody,
  paymentOutcomeTitle,
} from '@/utils/paymentStatus';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function PaymentPendingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const { hydrated, session, devSession } = useAuthSession();
  const { isBuyNow, clearBuyNow, clearCart } = useMockCart();
  const { recordVerifiedPaidOrder, findOrder } = usePreviewSession();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    amount?: string | string[];
    currency?: string | string[];
    auto?: string | string[];
  }>();

  const orderId = firstParam(params.orderId)?.trim() ?? '';
  const amountParam = Number(firstParam(params.amount));
  const currency = firstParam(params.currency)?.trim() || 'INR';
  const autoStart = firstParam(params.auto) !== '0';

  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [statusLabel, setStatusLabel] = useState('ACTIVE');
  const [message, setMessage] = useState('Payment not completed yet.');
  const [amount, setAmount] = useState(Number.isFinite(amountParam) ? amountParam : 0);
  const pollAttemptRef = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const verifying = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/orders');
      return true;
    });
    return () => sub.remove();
  }, []);

  const finalizePaid = useCallback(
    async (verifiedOrderId: string, paidAmount: number | null, paidCurrency: string | null) => {
      const pending = await loadPendingPayment();
      const existing = findOrder(verifiedOrderId);
      if (!existing) {
        recordVerifiedPaidOrder(
          buildVerifiedCashfreeOrder({
            orderId: verifiedOrderId,
            amount: paidAmount ?? pending?.amount ?? amount,
            addressTitle: pending?.addressTitle || 'Delivery address',
            addressLine: pending?.addressLine || 'Address on file',
            items: pending?.itemSummary?.length
              ? pending.itemSummary
              : [{ id: 'paid', name: 'Paid order', quantity: 1 }],
          }),
        );
      }
      if (isBuyNow) {
        clearBuyNow();
      } else {
        clearCart();
      }
      await clearPendingPayment(verifiedOrderId);
      router.replace({
        pathname: '/payment-success',
        params: {
          orderId: verifiedOrderId,
          amount: String(paidAmount ?? amount),
          currency: paidCurrency ?? currency,
          method: 'Cashfree',
        },
      });
    },
    [amount, clearBuyNow, clearCart, currency, findOrder, isBuyNow, recordVerifiedPaidOrder],
  );

  const routeForOutcome = useCallback(
    (outcome: string, verifiedOrderId: string, paidAmount: number | null, paidCurrency: string | null) => {
      if (outcome === 'paid') {
        void finalizePaid(verifiedOrderId, paidAmount, paidCurrency);
        return;
      }
      if (outcome === 'failed' || outcome === 'expired' || outcome === 'cancelled') {
        router.replace({
          pathname: '/payment-failure',
          params: {
            orderId: verifiedOrderId,
            amount: String(paidAmount ?? amount),
            currency: paidCurrency ?? currency,
            reason: outcome,
          },
        });
      }
    },
    [amount, currency, finalizePaid],
  );

  const checkStatus = useCallback(
    async (options?: { fromPoll?: boolean }) => {
      if (!orderId || verifying.current) {
        return;
      }
      verifying.current = true;
      if (!options?.fromPoll) {
        setChecking(true);
      }
      try {
        const result = await verifyCashfreePayment(orderId);
        if (!mounted.current) {
          return;
        }
        setStatusLabel(result.rawPaymentStatus || result.paymentStatus);
        setMessage(paymentOutcomeBody(result.outcome, result.message));
        if (result.amount != null) {
          setAmount(result.amount);
        }
        if (result.isPaid) {
          routeForOutcome('paid', result.orderId || orderId, result.amount, result.currency);
          return;
        }
        if (result.outcome === 'failed' || result.outcome === 'expired' || result.outcome === 'cancelled') {
          routeForOutcome(result.outcome, result.orderId || orderId, result.amount, result.currency);
          return;
        }
        // Stay pending / unknown — schedule bounded poll when auto.
        if (autoStart) {
          const delay = nextPaymentPollDelayMs(pollAttemptRef.current);
          if (delay != null) {
            pollAttemptRef.current += 1;
            pollTimer.current = setTimeout(() => {
              void checkStatus({ fromPoll: true });
            }, delay);
          }
        }
      } finally {
        verifying.current = false;
        if (mounted.current) {
          setChecking(false);
        }
      }
    },
    [autoStart, orderId, routeForOutcome],
  );

  useEffect(() => {
    if (!orderId || !autoStart) {
      return;
    }
    void checkStatus({ fromPoll: true });
    // Intentionally once on mount for this orderId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, autoStart]);

  const retryPayment = useCallback(async () => {
    if (retrying || !orderId) {
      return;
    }
    setRetrying(true);
    try {
      const pending = await loadPendingPayment();
      if (!pending || pending.orderId !== orderId || !pending.paymentSessionId) {
        setMessage('This payment session is no longer available. Return to checkout to start a new payment.');
        return;
      }
      router.push({
        pathname: '/payment-checkout',
        params: {
          orderId: pending.orderId,
          paymentSessionId: pending.paymentSessionId,
          amount: String(pending.amount),
          currency: pending.currency,
        },
      });
    } finally {
      if (mounted.current) {
        setRetrying(false);
      }
    }
  }, [orderId, retrying]);

  if (hydrated && !session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  if (!orderId) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Payment Pending" fallbackHref="/payment" />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No payment to check</Text>
          <Text style={styles.emptyBody}>Return to checkout to start a secure payment.</Text>
          <PrimaryButton label="Back to Checkout" showArrow={false} onPress={() => router.replace('/checkout')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Payment Pending" fallbackHref="/orders" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { width: contentWidth, paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            {checking ? (
              <ActivityIndicator color={colors.primaryInk} />
            ) : (
              <AppIcon name="clock" color={colors.primaryInk} size={28} />
            )}
          </View>
          <Text style={styles.heroTitle}>{paymentOutcomeTitle('pending')}</Text>
          <Text style={styles.heroBody}>{message}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.rowLabel}>Order ID</Text>
          <Text style={styles.rowValue} selectable>
            {orderId}
          </Text>
          <Text style={styles.rowLabel}>Amount</Text>
          <Text style={styles.rowValue}>
            {formatRupee(amount)} {currency !== 'INR' ? currency : ''}
          </Text>
          <Text style={styles.rowLabel}>Payment status</Text>
          <Text style={styles.rowValue}>{statusLabel}</Text>
        </View>

        <PrimaryButton
          label="Check Payment Status"
          loading={checking}
          showArrow={false}
          onPress={() => {
            pollAttemptRef.current = 0;
            void checkStatus();
          }}
        />
        <Pressable
          accessibilityRole="button"
          disabled={retrying}
          onPress={() => void retryPayment()}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed, retrying && styles.inactive]}>
          <Text style={styles.secondaryLabel}>{retrying ? 'Opening Cashfree…' : 'Retry Payment'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/orders')}
          style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}>
          <Text style={styles.linkLabel}>Back to Orders</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
    gap: 14,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 16,
    gap: 6,
    ...shadow.soft,
  },
  rowLabel: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  secondary: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  inactive: {
    opacity: 0.55,
  },
});
