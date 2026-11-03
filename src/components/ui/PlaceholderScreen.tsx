import { StyleSheet, Text, View } from 'react-native';

import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, fonts } from '@/constants/theme';

type PlaceholderScreenProps = {
  title: string;
  message: string;
  detail?: string;
  withHeader?: boolean;
};

export function PlaceholderScreen({ title, message, detail, withHeader = false }: PlaceholderScreenProps) {
  return (
    <View style={styles.screen}>
      {withHeader ? <AppScreenHeader title={title} /> : null}
      <View style={[styles.body, !withHeader && styles.bodyTopSafe]}>
        <BrandLogo height={64} />
        {!withHeader ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 8,
  },
  bodyTopSafe: {
    paddingTop: 48,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  detail: {
    marginTop: 8,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryInk,
  },
});
