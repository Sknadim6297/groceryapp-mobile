import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';

/**
 * Buy Again requires real past-order history from the backend.
 * Until that API exists, show an honest empty state — never catalogue fixtures as purchases.
 */
export default function BuyAgainScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Buy Again" fallbackHref="/home" />
      {UI_PREVIEW_MODE ? (
        <View style={styles.bannerPad}>
          <DemoBanner message="Buy Again needs past-order history. Demo does not invent purchases." />
        </View>
      ) : null}
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <EmptyState
          title="No purchase history yet"
          body="Items you buy will appear here after order history is connected. We never invent past purchases from the catalogue."
          art={
            <View style={styles.emptyIcon}>
              <AppIcon name="refresh" color={colors.primaryInk} size={32} />
            </View>
          }
          action={
            <View style={styles.emptyAction}>
              <PrimaryButton
                label="Browse shop"
                accessibilityLabel="Browse shop"
                onPress={() => router.push('/shop')}
              />
            </View>
          }
        />
        <Text style={styles.footnote}>
          Looking for something you viewed recently? Open Home after browsing products — Recently Viewed is saved on
          this device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  bannerPad: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: homeLayout.gutter,
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    minWidth: 200,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
