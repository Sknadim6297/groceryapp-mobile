import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { SoftIcon, type SoftIconName } from '@/components/ui/SoftIcon';
import { colors, fonts } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  showHeart?: boolean;
  icon?: SoftIconName;
};

export function SectionHeader({ title, subtitle, showHeart, icon }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          {icon ? <SoftIcon name={icon} size={22} /> : null}
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {showHeart ? <AppIcon name="heart" color={colors.textSecondary} size={16} /> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View all ${title}`}
        hitSlop={8}
        onPress={() => router.push('/shop')}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <Text style={styles.actionLabel}>View all</Text>
        <AppIcon name="chevron" color={colors.textSecondary} size={14} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    flexShrink: 0,
  },
  actionLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
