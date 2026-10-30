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
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  accent: {
    color: colors.primaryDark,
  },
  support: {
    marginTop: 10,
    fontFamily: fonts.interRegular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.welcomeMuted,
  },
  supportCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
});
