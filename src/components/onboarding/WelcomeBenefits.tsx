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
            <AppIcon name={benefit.icon} color={colors.text} size={15} />
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
    alignItems: 'flex-start',
    marginTop: 18,
    gap: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.welcomeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.welcomeMuted,
    textAlign: 'center',
  },
});
