import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors, fonts } from '@/constants/theme';

type PlaceholderScreenProps = {
  title: string;
  message: string;
  detail?: string;
  withHeader?: boolean;
};

export function PlaceholderScreen({ title, message, detail, withHeader = false }: PlaceholderScreenProps) {
  return (
    <ScreenContainer edges={withHeader ? ['left', 'right'] : ['top', 'left', 'right']}>
      <View style={styles.body}>
        <BrandLogo height={64} />
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 8,
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
