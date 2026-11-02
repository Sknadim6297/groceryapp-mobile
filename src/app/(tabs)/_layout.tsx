import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { useAuthSession } from '@/context/AuthSessionContext';
import { canUseDevelopmentHome } from '@/services/devOtp';

export default function TabLayout() {
  const { hydrated, session, devSession } = useAuthSession();
  if (!hydrated) {
    return null;
  }
  if (!session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarAccessibilityLabel: 'Shop',
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarAccessibilityLabel: 'Track',
        }}
      />
      <Tabs.Screen name="top-picks" options={{ href: null }} />
      <Tabs.Screen name="stores" options={{ href: null }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarAccessibilityLabel: 'Cart',
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
