import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SoftIcon, type SoftIconName } from '@/components/ui/SoftIcon';
import { colors, fonts } from '@/constants/theme';

const CHIP = '#F6E8B8';
const INK = '#171717';

type HomeTab = {
  id: string;
  label: string;
  icon: SoftIconName;
  badge?: string;
};

const tabs: HomeTab[] = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'fresh', label: 'Fresh', icon: 'leaf' },
  { id: 'diwali', label: 'Diwali', icon: 'diya', badge: 'Shop now' },
  { id: 'electronics', label: 'Electronics', icon: 'plug' },
  { id: 'organic', label: 'Organic', icon: 'plant' },
  { id: 'gifting', label: 'Gifting', icon: 'gift' },
];

export function HomeCategoryTabs() {
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState('all');
  const tabWidth = Math.max(56, Math.min(72, (Math.min(width, 480) - 20) / 5.15));

  return (
    <View style={styles.strip}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.scroller}
        contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const active = selected === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.badge ? `${tab.label}. ${tab.badge}` : tab.label}
              onPress={() => setSelected(tab.id)}
              style={[styles.tab, { width: tabWidth }]}>
              <View style={styles.iconSlot}>
                {tab.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
                <View style={[styles.chip, width < 360 && styles.chipCompact, active && styles.chipActive]}>
                  <SoftIcon name={tab.icon} size={width < 360 ? 20 : 22} />
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.label, width < 360 && styles.labelCompact]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginTop: 8,
    backgroundColor: colors.cream,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scroller: {
    flexGrow: 0,
  },
  row: {
    paddingLeft: 12,
    paddingRight: 16,
    alignItems: 'flex-end',
    gap: 2,
  },
  tab: {
    alignItems: 'center',
    paddingTop: 14,
  },
  iconSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 36,
  },
  badge: {
    position: 'absolute',
    top: -13,
    zIndex: 2,
    alignSelf: 'center',
    backgroundColor: INK,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 7,
    lineHeight: 9,
    color: colors.white,
  },
  chip: {
    width: 44,
    height: 36,
    borderRadius: 14,
    backgroundColor: CHIP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: {
    width: 40,
    height: 34,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: colors.white,
    shadowColor: '#A16207',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: INK,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
});
