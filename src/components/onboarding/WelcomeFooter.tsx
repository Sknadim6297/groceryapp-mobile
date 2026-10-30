import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts } from '@/constants/theme';

export function WelcomeFooter() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      <PrimaryButton label="Get Started" onPress={() => router.push('/login')} />
      <Text maxFontSizeMultiplier={1.3} style={styles.legal}>
        By continuing, you agree to our{' '}
        <Text
          accessibilityRole="link"
          style={styles.link}
          onPress={() => router.push('/terms')}>
          Terms & Conditions
        </Text>{' '}
        and{' '}
        <Text
          accessibilityRole="link"
          style={styles.link}
          onPress={() => router.push('/privacy')}>
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  legal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.welcomeMuted,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
});
