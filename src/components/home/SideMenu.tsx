import { router, usePathname, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DrawerHeader } from "@/components/navigation/drawer/DrawerHeader";
import { DrawerItem } from "@/components/navigation/drawer/DrawerItem";
import { colors } from "@/constants/theme";
import { useAuthSession } from "@/context/AuthSessionContext";
import { useCustomerAccount } from "@/context/CustomerAccountContext";
import { useRememberedCustomer } from "@/context/RememberedCustomerContext";
import {
    isSideMenuItemActive,
    sideMenuItems,
    type SideMenuItem,
} from "@/navigation/sideMenuItems";
import { displayCustomer } from "@/services/rememberedCustomer";
import {
    registeredDisplayName,
    registeredDisplayPhone,
} from "@/utils/registeredIdentity";

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const { session, clearAuthSession } = useAuthSession();
  const { account } = useCustomerAccount();
  const { customer: remembered } = useRememberedCustomer();
  const panelWidth = Math.min(300, Math.max(240, Math.round(width * 0.78)));
  const [translateX] = useState(() => new Animated.Value(-panelWidth));
  const [backdrop] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);
  const nativeDriver = Platform.OS !== "web";
  const identity = displayCustomer(session, account, remembered);
  const name = registeredDisplayName(identity);
  const phone = registeredDisplayPhone(identity);

  if (visible && !mounted) {
    setMounted(true);
  }

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
    router.push({ pathname: "/menu", params: { section: label } });
  }

  function openItem(item: SideMenuItem) {
    if (item.action === 'logout') {
      onClose();
      clearAuthSession();
      router.replace('/login');
      return;
    }
    if (item.href) {
      openRoute(item.href);
      return;
    }
    openPlaceholder(item.label);
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.fill}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={onClose}
            style={styles.fill}
          />
        </Animated.View>
        <Animated.View
          accessibilityRole="menu"
          style={[
            styles.panel,
            { width: panelWidth, transform: [{ translateX }] },
          ]}
        >
          <DrawerHeader
            name={name}
            subtitle={phone}
            paddingTop={Math.max(insets.top, 20)}
          />
          <ScrollView
            style={styles.list}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 12),
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {sideMenuItems.map((item) => (
              <DrawerItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                active={isSideMenuItemActive(item, pathname)}
                onPress={() => openItem(item)}
              />
            ))}
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
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(23, 23, 23, 0.4)",
  },
  panel: {
    position: "absolute",
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
