import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type WelcomeHeadlineProps = {
  compact: boolean;
};

export function WelcomeHeadline({ compact }: WelcomeHeadlineProps) {
  return (
    <View style={styles.wrap}>
      <Text
        accessibilityRole="header"
        accessibilityLabel="Fresh groceries. At your doorstep."
        maxFontSizeMultiplier={1.15}
        style={[styles.title, compact && styles.titleCompact]}>
        Fresh groceries.{'\n'}
        <Text style={styles.accent}>At your doorstep.</Text>
      </Text>
      <Text maxFontSizeMultiplier={1.2} style={[styles.support, compact && styles.supportCompact]}>
        Everything you need, delivered fresh & fast.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
  },
  title: {
    fontFamily: fonts.interBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  accent: {
    color: colors.primaryInk,
  },
  support: {
    marginTop: 8,
    fontFamily: fonts.interRegular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  supportCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
});
