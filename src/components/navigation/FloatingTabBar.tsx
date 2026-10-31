import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

const tabs = [
  { name: 'home', label: 'Home', icon: 'home', activeIcon: 'homeFocused' },
  { name: 'shop', label: 'Shop', icon: 'shop', activeIcon: 'shop' },
  { name: 'track', label: 'Track', icon: 'truck', activeIcon: 'truck' },
  { name: 'cart', label: 'Cart', icon: 'cart', activeIcon: 'cart' },
] as const satisfies readonly { name: string; label: string; icon: AppIconName; activeIcon: AppIconName }[];

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigateToTab: (routeKey: string) => void;
  insets: { bottom: number };
};

export function FloatingTabBar({ state, descriptors, navigateToTab, insets }: FloatingTabBarProps) {
  const focusedName = state.routes[state.index]?.name;

  return (
    <View style={[styles.slot, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 }]}>
      <View style={styles.menu}>
        {tabs.map((tab) => {
          const route = state.routes.find((item) => item.name === tab.name);
          if (!route) {
            return null;
          }
          const focused = focusedName === tab.name;
          const label = descriptors[route.key]?.options.title ?? tab.label;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              aria-selected={focused}
              onPress={() => navigateToTab(route.key)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
              <View style={[styles.item, focused && styles.itemActive]}>
                <AppIcon
                  name={focused ? tab.activeIcon : tab.icon}
                  color={focused ? colors.primaryInk : colors.text}
                  size={18}
                />
                <Text numberOfLines={1} style={[styles.label, focused && styles.labelActive]}>
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
    paddingHorizontal: 10,
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
