import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

type DrawerItemProps = {
  label: string;
  icon: AppIconName;
  active?: boolean;
  onPress: () => void;
  showChevron?: boolean;
  expanded?: boolean;
  nested?: boolean;
};

export function DrawerItem({
  label,
  icon,
  active = false,
  onPress,
  showChevron = false,
  expanded = false,
  nested = false,
}: DrawerItemProps) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, expanded: showChevron ? expanded : undefined }}
      aria-selected={active}
      onPress={onPress}
      style={({ pressed }) => [styles.row, nested && styles.nested, active && styles.active, pressed && styles.pressed]}>
      <AppIcon name={icon} color={active ? colors.primaryInk : colors.text} size={18} />
      <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
        {label}
      </Text>
      {showChevron ? (
        <AppIcon name={expanded ? 'chevronDown' : 'chevron'} color={colors.textSecondary} size={16} />
      ) : (
        <View style={styles.spacer} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  nested: {
    paddingLeft: 36,
    backgroundColor: colors.softBackground,
  },
  active: {
    backgroundColor: colors.softYellow,
  },
  label: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  labelActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
  spacer: {
    width: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
