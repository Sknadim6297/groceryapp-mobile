import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerHeader } from '@/components/navigation/drawer/DrawerHeader';
import { DrawerItem } from '@/components/navigation/drawer/DrawerItem';
import { type AppIconName } from '@/components/ui/AppIcon';
import { colors } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useProfileDraft } from '@/context/ProfileDraftContext';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';

type MenuItem = {
  label: string;
  icon: AppIconName;
  href?: Href;
};

const items: MenuItem[] = [
  { label: 'Homepage', icon: 'home', href: '/home' },
  { label: 'Listing', icon: 'grid', href: '/shop' },
  { label: 'Product Detail', icon: 'bag', href: { pathname: '/product/[id]', params: { id: 'eggs' } } },
  { label: 'Cart', icon: 'cart', href: '/cart' },
  { label: 'Payment Option', icon: 'card', href: '/payment' },
  { label: 'Payment Time', icon: 'clock', href: '/payment' },
  { label: 'Order Received', icon: 'check', href: '/orders' },
  { label: 'Track Order', icon: 'truck', href: '/track' },
  { label: 'Track Delivery Boy', icon: 'profile', href: '/track' },
  { label: 'Profile', icon: 'profile', href: '/profile' },
  { label: 'Order Details', icon: 'box', href: '/orders' },
];

const subItems: MenuItem[] = [
  { label: 'Sample link', icon: 'link' },
  { label: 'Another sample', icon: 'link' },
];

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const { fullName } = useProfileDraft();
  const { nationalNumber } = useAuthFlow();
  const panelWidth = Math.min(300, Math.max(240, Math.round(width * 0.78)));
  const translateX = useRef(new Animated.Value(-panelWidth)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const nativeDriver = Platform.OS !== 'web';
  const name = fullName.trim() || 'Your account';
  const phone = isValidIndiaMobile(nationalNumber) ? `+91 ${formatIndiaMobileDisplay(nationalNumber)}` : 'No phone number yet';

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (visible) {
      translateX.setValue(-panelWidth);
      backdrop.setValue(0);
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -panelWidth,
        duration: visible ? 240 : 200,
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(backdrop, {
        toValue: visible ? 1 : 0,
        duration: visible ? 240 : 200,
        useNativeDriver: nativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
      }
    });
  }, [backdrop, mounted, nativeDriver, panelWidth, translateX, visible]);

  function openRoute(href: Href) {
    onClose();
    router.push(href);
  }

  function openPlaceholder(label: string) {
    onClose();
    router.push({ pathname: '/menu', params: { section: label } });
  }

  function openItem(item: MenuItem) {
    if (item.href) {
      openRoute(item.href);
      return;
    }
    openPlaceholder(item.label);
  }

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.fill}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={styles.fill} />
        </Animated.View>
        <Animated.View
          accessibilityRole="menu"
          style={[styles.panel, { width: panelWidth, transform: [{ translateX }] }]}>
          <DrawerHeader name={name} phone={phone} paddingTop={Math.max(insets.top, 20)} />
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) }}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {items.map((item) => (
              <DrawerItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                active={item.href === pathname}
                onPress={() => openItem(item)}
              />
            ))}
            <DrawerItem
              label="Example Multi Link"
              icon="link"
              showChevron
              expanded={linksOpen}
              onPress={() => setLinksOpen((open) => !open)}
            />
            {linksOpen
              ? subItems.map((item) => (
                  <DrawerItem
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    nested
                    onPress={() => openPlaceholder(item.label)}
                  />
                ))
              : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(23, 23, 23, 0.4)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.white,
    shadowColor: colors.text,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 8,
  },
  list: {
    flex: 1,
  },
});
