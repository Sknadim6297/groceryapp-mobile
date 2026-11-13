import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useEffect } from 'react';

import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CASHFREE_ENV, CASHFREE_IS_SANDBOX } from '@/constants/cashfree';
import { colors, fonts, homeLayout, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { canUseDevelopmentHome } from '@/services/devOtp';
import {
  buildCashfreeSessionCheckoutHtml,
  shouldVerifyAfterCashfreeNavigation,
} from '@/utils/cashfreeCheckoutHtml';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function CashfreeWebCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { hydrated, session, devSession } = useAuthSession();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    paymentSessionId?: string | string[];
    amount?: string | string[];
    currency?: string | string[];
  }>();

  const orderId = firstParam(params.orderId)?.trim() ?? '';
  const paymentSessionId = firstParam(params.paymentSessionId)?.trim() ?? '';
  const amount = firstParam(params.amount)?.trim() ?? '0';
  const currency = firstParam(params.currency)?.trim() || 'INR';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const finished = useRef(false);

  const html = useMemo(() => {
    if (!paymentSessionId) {
      return '';
    }
    return buildCashfreeSessionCheckoutHtml(paymentSessionId, CASHFREE_ENV);
  }, [paymentSessionId]);

  const goVerify = useCallback(() => {
    if (finished.current || !orderId) {
      return;
    }
    finished.current = true;
    router.replace({
      pathname: '/payment-pending',
      params: {
        orderId,
        amount,
        currency,
        auto: '1',
      },
    });
  }, [amount, currency, orderId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goVerify();
      return true;
    });
    return () => sub.remove();
  }, [goVerify]);

  const onNav = useCallback(
    (nav: WebViewNavigation) => {
      if (shouldVerifyAfterCashfreeNavigation(nav.url)) {
        goVerify();
      }
    },
    [goVerify],
  );

  if (hydrated && !session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  if (!orderId || !paymentSessionId || !html) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Secure Payment" fallbackHref="/payment" />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Checkout unavailable</Text>
          <Text style={styles.emptyBody}>Missing payment session. Return to payment and try again.</Text>
          <PrimaryButton label="Back to Payment" showArrow={false} onPress={() => router.replace('/payment')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Secure Payment" fallbackHref="/payment" />
      <View style={styles.webWrap}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primaryInk} />
            <Text style={styles.loadingText}>Loading Cashfree…</Text>
          </View>
        ) : null}
        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not open checkout</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <PrimaryButton label="Check Payment Status" showArrow={false} onPress={goVerify} />
          </View>
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{
              html,
              baseUrl: CASHFREE_IS_SANDBOX ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com',
            }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={onNav}
            onError={() => {
              setLoading(false);
              setLoadError('Cashfree checkout failed to load. You can still check payment status.');
            }}
            onHttpError={() => {
              setLoading(false);
              setLoadError('Cashfree checkout returned an error. Check payment status to continue safely.');
            }}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            style={styles.web}
          />
        )}
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.footerHint}>
          After paying, tap below. We only confirm success after server verification.
        </Text>
        <PrimaryButton label="I completed payment · Check status" showArrow={false} onPress={goVerify} />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.replace({
              pathname: '/payment-failure',
              params: {
                orderId,
                amount,
                currency,
                reason: 'cancelled',
                message: 'Payment was closed before verification. You can retry from checkout.',
              },
            });
          }}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
          <Text style={styles.cancelLabel}>Cancel and go back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  webWrap: {
    flex: 1,
    position: 'relative',
  },
  web: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.warmBackground,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLabel: {
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
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    gap: 12,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.danger,
  },
  errorBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
