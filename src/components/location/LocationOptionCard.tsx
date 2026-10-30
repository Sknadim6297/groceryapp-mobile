import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

type LocationOptionCardProps = {
  icon: AppIconName;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  busy?: boolean;
};

export function LocationOptionCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
  busy = false,
}: LocationOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, busy }}
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && !busy && styles.pressed]}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} color={colors.text} size={18} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      {busy ? (
        <ActivityIndicator color={colors.primaryDark} />
      ) : (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 72,
  },
  selected: {
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.86,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});
