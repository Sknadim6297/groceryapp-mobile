import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';

const INK = '#6B7280';
const PINK = '#F43F86';
const BAR = '#E6D9F4';

type TabId = 'home' | 'categories' | 'buy-again' | 'basket';

type HomeFloatingNavProps = {
  onBuyAgain: () => void;
};

export function HomeFloatingNav({ onBuyAgain }: HomeFloatingNavProps) {
  const { width } = useWindowDimensions();
  const { totalCount } = useMockCart();
  const compact = width < 360;

  const tabs: { id: TabId; label: string; icon: AppIconName }[] = [
    { id: 'home', label: 'Home', icon: 'homeFocused' },
    { id: 'categories', label: 'Categories', icon: 'grid' },
    { id: 'buy-again', label: 'Buy Again', icon: 'refresh' },
    { id: 'basket', label: 'Basket', icon: 'bag' },
  ];

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = tab.id === 'home';
        const count = tab.id === 'basket' ? totalCount : 0;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={count > 0 ? `${tab.label}, ${count} items` : tab.label}
            onPress={() => onPressTab(tab.id, onBuyAgain)}
            style={styles.tab}>
            <View style={[styles.item, active && styles.itemActive, compact && styles.itemCompact]}>
              <View>
                <AppIcon
                  name={tab.icon}
                  color={active ? '#FFFFFF' : INK}
                  size={compact ? 16 : 18}
                  weight="light"
                />
                {count > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, compact && styles.labelCompact, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function onPressTab(id: TabId, onBuyAgain: () => void) {
  if (id === 'categories') {
    router.push('/shop');
    return;
  }
  if (id === 'basket') {
    router.push('/cart');
    return;
  }
  if (id === 'buy-again') {
    onBuyAgain();
  }
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 10,
    marginTop: 6,
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: BAR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#6B4C8A',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 16,
  },
  itemCompact: {
    minWidth: 0,
    paddingHorizontal: 2,
  },
  itemActive: {
    backgroundColor: PINK,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 12,
    color: INK,
  },
  labelCompact: {
    fontSize: 9,
    lineHeight: 11,
  },
  labelActive: {
    fontFamily: fonts.semibold,
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
    color: '#FFFFFF',
  },
});
