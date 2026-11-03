import { Redirect, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { DemoPaymentCard } from '@/components/payment/DemoPaymentCard';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { type AppIconName } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { PAYMENT_METHOD_DETAIL, PAYMENT_METHOD_OPTIONS } from '@/data/demoPaymentCard';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import {
  activateDevicePaymentPreferenceStore,
  loadPaymentPreference,
  savePaymentPreference,
} from '@/services/paymentPreferenceStore';
import type { PaymentMethodId } from '@/types/paymentPreferences';

const METHOD_ICONS: Record<PaymentMethodId, AppIconName> = {
  card: 'card',
  upi: 'phone',
  cod: 'box',
};

export default function MyPaymentScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { hydrated, session, devSession } = useAuthSession();
  const [ready, setReady] = useState(false);
  const [primaryMethodId, setPrimaryMethodId] = useState<PaymentMethodId>('card');
  const [cardPreviewHidden, setCardPreviewHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailId, setDetailId] = useState<PaymentMethodId | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDevicePaymentPreferenceStore();
      }
      const preference = await loadPaymentPreference();
      if (cancelled) {
        return;
      }
      setPrimaryMethodId(preference.primaryMethodId);
      setCardPreviewHidden(preference.cardPreviewHidden);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated || !ready) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    if (!focused) {
      return null;
    }
    return <Redirect href={profileRoutes.login} />;
  }

  async function selectPrimary(id: PaymentMethodId) {
    setPrimaryMethodId(id);
    await savePaymentPreference({ primaryMethodId: id, cardPreviewHidden });
    showToast('success', 'Demo preference saved on this device only.');
  }

  async function setCardHidden(next: boolean) {
    setCardPreviewHidden(next);
    setMenuOpen(false);
    await savePaymentPreference({ primaryMethodId, cardPreviewHidden: next });
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="My Payment" fallbackHref={profileRoutes.profile} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {UI_PREVIEW_MODE ? (
          <DemoBanner message="Demo payment preferences only — no cards, UPI apps, or banks are contacted." />
        ) : (
          <DemoBanner message="Payment preferences are local demo UI until a wallet API is published." />
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Card</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Demo card options"
              hitSlop={8}
              onPress={() => setMenuOpen(true)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
              <Text style={styles.menuDots}>•••</Text>
            </Pressable>
          </View>
          <DemoPaymentCard hidden={cardPreviewHidden} />
          <Text style={styles.footnote}>
            Visual preview only. No real card number, CVV, or payment token is stored.
          </Text>
        </View>

        <Text style={styles.listHeading}>Payment methods</Text>
        <View style={styles.methods}>
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <PaymentMethodCard
              key={method.id}
              id={method.id}
              title={method.title}
              subtitle={method.subtitle}
              icon={METHOD_ICONS[method.id]}
              primary={primaryMethodId === method.id}
              onSelectPrimary={() => void selectPrimary(method.id)}
              onOpenDetails={() => setDetailId(method.id)}
            />
          ))}
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Demo card options</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                showToast('success', 'Demo card: masked preview only. No real instrument is on file.');
              }}
              style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}>
              <Text style={styles.sheetActionLabel}>View demo card info</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void setCardHidden(!cardPreviewHidden)}
              style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}>
              <Text style={styles.sheetActionLabel}>
                {cardPreviewHidden ? 'Show demo card preview' : 'Hide demo card preview'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMenuOpen(false)}
              style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}>
              <Text style={styles.sheetCancelLabel}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={detailId !== null} transparent animationType="fade" onRequestClose={() => setDetailId(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setDetailId(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              {detailId ? PAYMENT_METHOD_OPTIONS.find((item) => item.id === detailId)?.title : 'Payment method'}
            </Text>
            <Text style={styles.sheetBody}>{detailId ? PAYMENT_METHOD_DETAIL[detailId] : ''}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDetailId(null)}
              style={({ pressed }) => [styles.sheetPrimary, pressed && styles.pressed]}>
              <Text style={styles.sheetPrimaryLabel}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 14,
    gap: 14,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  menuDots: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 1,
    color: colors.text,
    marginTop: -4,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  listHeading: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  methods: {
    gap: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  sheetBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  sheetAction: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sheetActionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  sheetCancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  sheetPrimary: {
    minHeight: 48,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
