import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii, shadow } from '@/constants/theme';

type ProductAccordionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
  badge?: string;
};

export function ProductAccordion({ title, open, onToggle, children, badge }: ProductAccordionProps) {
  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, open && styles.headerOpen, pressed && styles.pressed]}>
        <Text style={[styles.title, open && styles.titleOpen]}>{title}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <AppIcon name={open ? 'chevronDown' : 'chevron'} color={open ? colors.primaryInk : colors.text} size={18} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadow.soft,
  },
  cardOpen: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
  },
  headerOpen: {
    backgroundColor: colors.softYellow,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  titleOpen: {
    color: colors.text,
  },
  badge: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 12,
  },
  pressed: {
    opacity: 0.88,
  },
});
