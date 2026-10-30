import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';

type TabIconName = 'home' | 'shop' | 'stores' | 'cart' | 'profile';

function TabIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  const iconName: AppIconName = name === 'home' && focused ? 'homeFocused' : name;

  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <AppIcon name={iconName} color={focused ? colors.text : colors.textSecondary} size={20} />
    </View>
  );
}

export default function TabLayout() {
  const { totalCount } = useMockCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarAccessibilityLabel: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon name="shop" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Stores',
          tabBarAccessibilityLabel: 'Stores',
          tabBarIcon: ({ focused }) => <TabIcon name="stores" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarAccessibilityLabel: 'Cart',
          tabBarBadge: totalCount > 0 ? totalCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ focused }) => <TabIcon name="cart" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    fontWeight: 'normal',
  },
  tabItem: {
    paddingTop: 4,
  },
  tabIcon: {
    width: 46,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.primary,
  },
  badge: {
    backgroundColor: colors.danger,
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
});
