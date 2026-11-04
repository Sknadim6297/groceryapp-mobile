import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SoftIcon, type SoftIconName } from '@/components/ui/SoftIcon';
import { colors, fonts } from '@/constants/theme';
import { listVisibleHomeShoppingShortcuts } from '@/data/shoppingCollections';
import type { ShoppingCollectionId } from '@/types/shoppingCollection';

const CHIP = '#F6E8B8';
const INK = '#171717';

const ICON_BY_COLLECTION: Record<ShoppingCollectionId, SoftIconName> = {
  all: 'grid',
  fresh: 'leaf',
  diwali: 'diya',
  electronics: 'plug',
  organic: 'plant',
};

export function HomeCategoryTabs() {
  const { width } = useWindowDimensions();
  const tabs = listVisibleHomeShoppingShortcuts();
  const tabWidth = Math.max(56, Math.min(72, (Math.min(width, 480) - 20) / 5.15));

  function openCollection(id: ShoppingCollectionId) {
    router.push({
      pathname: '/collection/[id]',
      params: { id },
    });
  }

  return (
    <View style={styles.strip}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.scroller}
        contentContainerStyle={styles.row}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={tab.badgeLabel ? `${tab.title}. ${tab.badgeLabel}` : tab.title}
            onPress={() => openCollection(tab.id)}
            style={[styles.tab, { width: tabWidth }]}
            testID={`home-shortcut-${tab.id}`}>
            <View style={styles.iconSlot}>
              {tab.badgeLabel ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badgeLabel}</Text>
                </View>
              ) : null}
              <View style={[styles.chip, width < 360 && styles.chipCompact]}>
                <SoftIcon name={ICON_BY_COLLECTION[tab.id]} size={24} />
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.label, width < 360 && styles.labelCompact]}>
              {shortcutLabel(tab.id)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function shortcutLabel(id: ShoppingCollectionId): string {
  switch (id) {
    case 'all':
      return 'All';
    case 'fresh':
      return 'Fresh';
    case 'diwali':
      return 'Diwali';
    case 'electronics':
      return 'Electronics';
    case 'organic':
      return 'Organic';
    default:
      return id;
  }
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
