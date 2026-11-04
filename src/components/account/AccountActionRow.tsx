import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts, radii, space } from '@/constants/theme';

type AccountActionRowProps = {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
  danger?: boolean;
  trailing?: 'chevron' | 'none';
};

export function AccountActionRow({
  icon,
  title,
  subtitle,
  onPress,
  testID,
  danger = false,
  trailing = 'chevron',
}: AccountActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={testID}>
      <View style={[styles.iconWash, danger && styles.iconWashDanger]}>
        <AppIcon name={icon} color={danger ? colors.danger : colors.primaryInk} size={18} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, danger && styles.titleDanger]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing === 'chevron' ? <AppIcon name="chevron" color={colors.textSecondary} size={18} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingVertical: 6,
  },
  iconWash: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWashDanger: {
    backgroundColor: '#FEE2E2',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  titleDanger: {
    color: colors.danger,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.78,
  },
});
