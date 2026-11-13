import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { clearPendingPayment } from '@/services/pendingPaymentStore';
import { formatRupee } from '@/utils/cartBill';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const { hydrated, session, devSession } = useAuthSession();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    amount?: string | string[];
    currency?: string | string[];
    method?: string | string[];
    txnRef?: string | string[];
  }>();

  const orderId = firstParam(params.orderId)?.trim() ?? '';
  const amount = Number(firstParam(params.amount));
  const currency = firstParam(params.currency)?.trim() || 'INR';
  const method = firstParam(params.method)?.trim();
  const txnRef = firstParam(params.txnRef)?.trim();

  useEffect(() => {
    if (orderId) {
      void clearPendingPayment(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/home');
      return true;
    });
    return () => sub.remove();
  }, []);

  if (hydrated && !session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#DCFCE7', '#F0FDF4', colors.warmBackground]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <AppScreenHeader title="Payment Successful" fallbackHref="/orders" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { width: contentWidth, paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.check}>
            <AppIcon name="check" color="#166534" size={32} />
          </View>
          <Text style={styles.title}>Payment Successful</Text>
          <Text style={styles.subtitle}>Verified by Mayapur Bazaar. Your cart was cleared after confirmation.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value} selectable>
            {orderId || '—'}
          </Text>
          <Text style={styles.label}>Paid amount</Text>
          <Text style={styles.value}>
            {Number.isFinite(amount) ? formatRupee(amount) : '—'}
            {currency !== 'INR' ? ` ${currency}` : ''}
          </Text>
          {method ? (
            <>
              <Text style={styles.label}>Payment method</Text>
              <Text style={styles.value}>{method}</Text>
            </>
          ) : null}
          {txnRef ? (
            <>
              <Text style={styles.label}>Transaction reference</Text>
              <Text style={styles.value} selectable>
                {txnRef}
              </Text>
            </>
          ) : null}
        </View>

        <PrimaryButton
          label="View Order"
          showArrow
          disabled={!orderId}
          onPress={() => {
            if (!orderId) {
              return;
            }
            router.replace({ pathname: '/order/[id]', params: { id: orderId } });
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/home')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>Continue Shopping</Text>
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
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  subtitle: {
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
    lineHeight: 20,
    color: colors.text,
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
  pressed: {
    opacity: 0.8,
  },
});
