import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

const benefits: readonly { icon: AppIconName; title: string; detail: string }[] = [
  { icon: 'bolt', title: 'Fast Delivery', detail: '16 minutes' },
  { icon: 'percent', title: 'Great Prices', detail: 'Everyday' },
  { icon: 'leaf', title: 'Fresh Quality', detail: 'Assured' },
];

type WelcomeBenefitsProps = {
  compact: boolean;
};

export function WelcomeBenefits({ compact }: WelcomeBenefitsProps) {
  return (
    <View style={styles.row} accessibilityRole="list">
      {benefits.map((benefit) => (
        <View
          key={benefit.title}
          style={styles.item}
          accessibilityRole="text"
          accessibilityLabel={`${benefit.title}, ${benefit.detail}`}>
          <View style={styles.badge}>
            <AppIcon name={benefit.icon} color={colors.primaryInk} size={18} />
          </View>
          <Text
            maxFontSizeMultiplier={1.15}
            numberOfLines={2}
            style={[styles.title, compact && styles.titleCompact]}>
            {benefit.title}
          </Text>
          <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.detail}>
            {benefit.detail}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 16,
    gap: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  detail: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
