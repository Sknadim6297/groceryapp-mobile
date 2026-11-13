import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { loadPendingPayment } from '@/services/pendingPaymentStore';
import { formatRupee } from '@/utils/cartBill';
import { paymentOutcomeBody } from '@/utils/paymentStatus';
import type { VerifiedPaymentOutcome } from '@/types/cashfreePayment';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asOutcome(raw: string | undefined): VerifiedPaymentOutcome {
  if (raw === 'failed' || raw === 'expired' || raw === 'cancelled' || raw === 'pending' || raw === 'paid') {
    return raw;
  }
  return 'failed';
}

export function PaymentFailureScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const { hydrated, session, devSession } = useAuthSession();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    amount?: string | string[];
    currency?: string | string[];
    reason?: string | string[];
    message?: string | string[];
  }>();

  const orderId = firstParam(params.orderId)?.trim() ?? '';
  const amount = Number(firstParam(params.amount));
  const currency = firstParam(params.currency)?.trim() || 'INR';
  const reason = asOutcome(firstParam(params.reason));
  const customMessage = firstParam(params.message);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/checkout');
      return true;
    });
    return () => sub.remove();
  }, []);

  const retryPayment = useCallback(async () => {
    if (retrying) {
      return;
    }
    setRetrying(true);
    setError(null);
    try {
      const pending = await loadPendingPayment();
      if (!pending?.paymentSessionId || (orderId && pending.orderId !== orderId)) {
        setError('Start a new payment from checkout. Reusing an old session can create duplicate charges.');
        return;
      }
      if (reason === 'expired') {
        setError('This payment session expired. Change method or return to checkout to create a new payment.');
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
      setRetrying(false);
    }
  }, [orderId, reason, retrying]);

  if (hydrated && !session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  const title =
    reason === 'expired' ? 'Payment Expired' : reason === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed';

  return (
    <View style={styles.screen}>
      <AppScreenHeader title={title} fallbackHref="/checkout" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { width: contentWidth, paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.iconPlate}>
            <AppIcon name="info" color={colors.danger} size={28} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{paymentOutcomeBody(reason, customMessage)}</Text>
        </View>

        <View style={styles.card}>
          {orderId ? (
            <>
              <Text style={styles.label}>Order ID</Text>
              <Text style={styles.value} selectable>
                {orderId}
              </Text>
            </>
          ) : null}
          {Number.isFinite(amount) && amount > 0 ? (
            <>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>
                {formatRupee(amount)}
                {currency !== 'INR' ? ` ${currency}` : ''}
              </Text>
            </>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Retry Payment"
          loading={retrying}
          showArrow={false}
          onPress={() => void retryPayment()}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace({ pathname: '/payment', params: { method: 'cod' } })}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>Change Payment Method</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/checkout')}
          style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}>
          <Text style={styles.linkLabel}>Back to Checkout</Text>
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
    paddingVertical: 16,
  },
  iconPlate: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 16,
    gap: 6,
    ...shadow.soft,
  },
  label: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radii.md,
    padding: 12,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  secondary: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  pressed: {
    opacity: 0.8,
  },
});
