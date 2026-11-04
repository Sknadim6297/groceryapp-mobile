import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import type { ShoppingCollectionHeroTone } from '@/types/shoppingCollection';

type CategoryHeroProps = {
  title: string;
  subtitle: string;
  icon: AppIconName;
  tone: ShoppingCollectionHeroTone;
  badgeLabel?: string;
  itemCount: number;
};

const TONE: Record<
  ShoppingCollectionHeroTone,
  { colors: readonly [string, string, string]; accent: string; iconBg: string; iconColor: string }
> = {
  warm: {
    colors: ['#FFF7CC', '#FFE566', '#FACC15'],
    accent: '#FDE68A',
    iconBg: colors.white,
    iconColor: colors.primaryInk,
  },
  fresh: {
    colors: ['#ECFDF5', '#D1FAE5', '#FEF9C3'],
    accent: '#86EFAC',
    iconBg: '#DCFCE7',
    iconColor: '#166534',
  },
  festive: {
    colors: ['#FFF7ED', '#FFEDD5', '#FDE68A'],
    accent: '#FDBA74',
    iconBg: '#FFEDD5',
    iconColor: '#9A3412',
  },
  cool: {
    colors: ['#EFF6FF', '#DBEAFE', '#FEF9C3'],
    accent: '#93C5FD',
    iconBg: '#DBEAFE',
    iconColor: '#1E40AF',
  },
  organic: {
    colors: ['#F0FDF4', '#DCFCE7', '#FEF9C3'],
    accent: '#86EFAC',
    iconBg: '#DCFCE7',
    iconColor: '#14532D',
  },
};

export function CategoryHero({ title, subtitle, icon, tone, badgeLabel, itemCount }: CategoryHeroProps) {
  const palette = TONE[tone];

  return (
    <LinearGradient colors={[...palette.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={[styles.glow, { backgroundColor: palette.accent }]} />
      <View style={styles.top}>
        <View style={[styles.iconPlate, { backgroundColor: palette.iconBg }]}>
          <AppIcon name={icon} color={palette.iconColor} size={22} />
        </View>
        {badgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.countPill}>
        <Text style={styles.countLabel}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.sheet,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...shadow.soft,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.45,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconPlate: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(17, 24, 39, 0.72)',
    maxWidth: 320,
  },
  countPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
});
