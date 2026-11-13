import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { brandLogo } from '@/constants/brand';
import { IS_SLIM_CLIENT_APK } from '@/constants/slimClient';
import { colors, fonts } from '@/constants/theme';

/**
 * Slim download APK omits expo-camera / ML Kit barcode (~5MB+).
 * Full camera scanner lives in `scan-qr-native.tsx` and is only required when native is linked.
 */
export default function ScanQrScreen() {
  if (IS_SLIM_CLIENT_APK) {
    return <SlimScanUnavailable />;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NativeScanQrScreen = require('./scan-qr-native').default as ComponentType;
  return <NativeScanQrScreen />;
}

function SlimScanUnavailable() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen} testID="scan-qr-screen">
      <AppScreenHeader title="Scan QR Code" fallbackHref="/home" />
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Image source={brandLogo} style={styles.logo} contentFit="contain" accessibilityLabel="Mayapur Bazaar" />
        <View style={styles.centerBox} testID="scan-qr-slim-unavailable">
          <AppIcon name="scan" color={colors.textSecondary} size={40} />
          <Text style={styles.statusText}>
            QR camera scanning is not included in this lightweight download build. Browse products
            and checkout as usual from Home.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to home"
            onPress={() => router.replace('/home')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            testID="scan-qr-slim-home">
            <Text style={styles.primaryLabel}>Go to Home</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  centerBox: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
  },
  statusText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
