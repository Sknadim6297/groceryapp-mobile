import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts } from '@/constants/theme';

export function WelcomeFooter() {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 251, 235, 0)', colors.cream]}
        style={styles.fade}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <PrimaryButton label="Get Started" onPress={() => router.push('/login')} />
        <Text maxFontSizeMultiplier={1.3} style={styles.legal}>
          By continuing, you agree to our{' '}
          <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/terms')}>
            Terms & Conditions
          </Text>{' '}
          and{' '}
          <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/privacy')}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    height: 22,
    marginBottom: -1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
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
