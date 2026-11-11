import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { useNetworkConnectivity } from '@/hooks/useNetworkConnectivity';
import { OFFLINE_BANNER_COPY } from '@/utils/networkConnectivity';

/**
 * Compact offline strip. Does not claim that being online means APIs work.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { showOfflineBanner } = useNetworkConnectivity();

  if (!showOfflineBanner) {
    return null;
  }

  return (
    <View
      style={[styles.banner, { paddingTop: Math.max(insets.top, 6) }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID="offline-banner">
      <Text style={styles.title}>You appear to be offline</Text>
      <Text style={styles.body}>{OFFLINE_BANNER_COPY}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#7C2D12',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.white,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#FED7AA',
  },
});
