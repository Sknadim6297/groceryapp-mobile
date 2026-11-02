import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { profileRoutes } from '@/navigation/profileRoutes';

const tabs = [
  { name: 'home', label: 'Home', icon: 'home', activeIcon: 'homeFocused' },
  { name: 'shop', label: 'Shop', icon: 'shop', activeIcon: 'shop' },
  { name: 'track', label: 'Track', icon: 'truck', activeIcon: 'truck' },
  { name: 'cart', label: 'Cart', icon: 'cart', activeIcon: 'cart' },
  { name: profileRoutes.tab, label: 'Profile', icon: 'profile', activeIcon: 'profile' },
] as const satisfies readonly { name: string; label: string; icon: AppIconName; activeIcon: AppIconName }[];

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigateToTab: (routeKey: string) => void;
  insets: { bottom: number; left?: number; right?: number };
};

export function FloatingTabBar({ state, descriptors, navigateToTab, insets }: FloatingTabBarProps) {
  const { totalCount } = useMockCart();
  const focusedName = state.routes[state.index]?.name;
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardOpen) {
    return null;
  }

  return (
    <View
      style={[
        styles.slot,
        {
          paddingBottom: insets.bottom,
          paddingLeft: 10 + (insets.left ?? 0),
          paddingRight: 10 + (insets.right ?? 0),
        },
      ]}>
      <View style={styles.menu}>
        {tabs.map((tab) => {
          const route = state.routes.find((item) => item.name === tab.name);
          if (!route) {
            return null;
          }
          const focused = focusedName === tab.name;
          const label = descriptors[route.key]?.options.title ?? tab.label;
          const count = tab.name === 'cart' ? totalCount : 0;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityLabel={count > 0 ? `${label}, ${count} items` : label}
              accessibilityState={{ selected: focused }}
              onPress={() => navigateToTab(route.key)}
              style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}>
              <View style={[styles.item, focused ? styles.itemActive : null]}>
                <View style={styles.iconSlot}>
                  <AppIcon
                    name={focused ? tab.activeIcon : tab.icon}
                    color={focused ? colors.primaryInk : colors.text}
                    size={24}
                  />
                  {count > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count > 9 ? '9+' : String(count)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={[styles.label, focused ? styles.labelActive : null]}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    backgroundColor: colors.white,
    paddingTop: 4,
  },
  menu: {
    minHeight: 58,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemActive: {
    backgroundColor: colors.softYellow,
  },
  iconSlot: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.white,
    includeFontPadding: false,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
});
