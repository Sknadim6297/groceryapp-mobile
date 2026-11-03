import Constants from "expo-constants";
import { Redirect, router, useIsFocused } from "expo-router";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SideMenu } from "@/components/home/SideMenu";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import { colors, fonts, homeLayout } from "@/constants/theme";
import { useAuthFlow } from "@/context/AuthFlowContext";
import { useAuthSession } from "@/context/AuthSessionContext";
import { useCustomerAccount } from "@/context/CustomerAccountContext";
import { useCustomerProfile } from "@/context/CustomerProfileContext";
import { useDeliveryLocation } from "@/context/DeliveryLocationContext";
import { useProfileDraft } from "@/context/ProfileDraftContext";
import { useRememberedCustomer } from "@/context/RememberedCustomerContext";
import { useSavedAddresses } from "@/context/SavedAddressesContext";
import { readPastOrders } from "@/data/pastOrders";
import { profileRoutes } from "@/navigation/profileRoutes";
import { canUseDevelopmentHome, clearDevTestSession } from "@/services/devOtp";
import { displayCustomer } from "@/services/rememberedCustomer";
import type { CustomerOrder, OrderStatus } from "@/types/order";
import { clearSignedInSession } from "@/utils/customerSession";
import {
    registeredDisplayName,
    registeredDisplayPhone,
} from "@/utils/registeredIdentity";

const statusLabel: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packing: "Packing",
  picked_up: "Picked up",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function appVersion(): string {
  const version = Constants.expoConfig?.version;
  return typeof version === "string" && version.trim().length > 0
    ? version.trim()
    : "1.0.0";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function orderSummary(order: CustomerOrder): string {
  if (order.items.length === 0) {
    return "Items were not included with this order.";
  }
  return order.items
    .map((item) => `${item.name} x ${item.quantity}`)
    .join(", ");
}

export function ProfileScreenView() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { hydrated, session, devSession, clearAuthSession } = useAuthSession();
  const { customer: remembered, clearRememberedCustomer } =
    useRememberedCustomer();
  const { account, clearAccount } = useCustomerAccount();
  const { setNationalNumber } = useAuthFlow();
  const { clearDraft } = useProfileDraft();
  const { clearDelivery } = useDeliveryLocation();
  const { clearActiveBook } = useSavedAddresses();
  const { clearActiveProfile } = useCustomerProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const orders = readPastOrders();

  if (!hydrated) {
    return null;
  }

  const developmentHome = canUseDevelopmentHome(devSession);
  if (!session && !developmentHome) {
    if (!focused) {
      return null;
    }
    return <Redirect href={profileRoutes.login} />;
  }

  const identity = displayCustomer(session, account, remembered);
  const mobile = identity
    ? registeredDisplayPhone(identity)
    : registeredDisplayPhone({
        customerId: "session",
        name: "",
        mobile: session?.mobile ?? devSession?.mobile ?? "",
        companyMobile: null,
      });
  const mark = initials(
    identity ? registeredDisplayName(identity) : "Your account",
  );

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.navigate("/home");
  }

  function confirmLogout() {
    clearSignedInSession({
      clearAuthSession,
      clearAccount,
      clearRememberedCustomer,
      setNationalNumber,
      clearDraft,
      clearDelivery,
      clearDevTestSession,
      clearSavedAddresses: clearActiveBook,
      clearCustomerProfile: clearActiveProfile,
    });
    setLogoutOpen(false);
    router.replace(profileRoutes.login);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="back" color={colors.text} size={24} />
        </Pressable>
        <View style={styles.avatar}>
          {mark ? (
            <Text style={styles.avatarText}>{mark}</Text>
          ) : (
            <AppIcon name="profile" color={colors.primaryInk} size={22} />
          )}
        </View>
        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.name}>
            {identity ? registeredDisplayName(identity) : "Your account"}
          </Text>
          <Text numberOfLines={1} style={styles.phone}>
            {mobile}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          accessibilityState={{ expanded: menuOpen }}
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="menu" color={colors.text} size={24} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, { maxWidth: homeLayout.maxWidth }]}>
          <OptionRow
            icon="pencil"
            title="My Account"
            subtitle="View and edit your profile"
            onPress={() => router.push(profileRoutes.account)}
          />
          <OptionRow
            icon="stores"
            title="My Addresses"
            subtitle="View, add and edit delivery addresses"
            onPress={() => router.push(profileRoutes.addresses)}
          />
          <OptionRow
            icon="heart"
            title="My Wishlist"
            subtitle="Your saved favorites"
            onPress={() => router.push(profileRoutes.wishlist)}
          />
          <OptionRow
            icon="headset"
            title="Help"
            subtitle="FAQs, support and useful links"
            onPress={() => router.push(profileRoutes.help)}
          />

          <Text accessibilityRole="header" style={styles.section}>
            Past orders
          </Text>

          {orders.kind === "ready"
            ? orders.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() =>
                    router.push({
                      pathname: "/order/[id]",
                      params: { id: order.id },
                    })
                  }
                />
              ))
            : null}
          {orders.kind === "empty" ? (
            <Notice title="No past orders" message={orders.message} />
          ) : null}
          {orders.kind === "error" ? (
            <Notice title="Orders are unavailable" message={orders.message} />
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.logoutDock,
          {
            paddingBottom: 14,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
          },
        ]}
      >
        <Text style={styles.version}>App version {appVersion()}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Logout"
          onPress={() => setLogoutOpen(true)}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Text style={styles.logoutLabel}>Logout</Text>
          <AppIcon name="chevron" color={colors.text} size={22} />
        </Pressable>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <LogoutSheet
        visible={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </View>
  );
}

function OptionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <AppIcon name={icon} color={colors.text} size={24} />
      <View style={styles.optionCopy}>
        <Text numberOfLines={1} style={styles.optionTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.optionSubtitle}>
          {subtitle}
        </Text>
      </View>
      <AppIcon name="chevron" color={colors.textSecondary} size={20} />
    </Pressable>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: CustomerOrder;
  onPress: () => void;
}) {
  const tone =
    order.status === "cancelled"
      ? "danger"
      : order.status === "delivered"
        ? "success"
        : "progress";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.id}, ${statusLabel[order.status]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.order, pressed && styles.pressed]}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderCopy}>
          <Text numberOfLines={1} style={styles.orderTitle}>
            {order.addressTitle || `Order ${order.id}`}
          </Text>
          <Text numberOfLines={1} style={styles.orderMeta}>
            {order.id}
          </Text>
        </View>
        <View style={[styles.badge, badgeBackground[tone]]}>
          <Text style={[styles.badgeText, badgeInk[tone]]}>
            {statusLabel[order.status]}
          </Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.summary}>
        {orderSummary(order)}
      </Text>
      <Text style={styles.when}>{order.placedAtLabel}</Text>
    </Pressable>
  );
}

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.notice}>
      <AppIcon name="box" color={colors.primaryInk} size={24} />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeMessage}>{message}</Text>
      </View>
    </View>
  );
}

function LogoutSheet({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close logout options"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <Text style={styles.sheetTitle}>Log out?</Text>
          <Text style={styles.sheetCopy}>
            This signs out the account saved for this session.
          </Text>
          <View style={styles.sheetActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel logout"
              onPress={onClose}
              style={({ pressed }) => [
                styles.sheetButton,
                styles.sheetCancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sheetCancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm logout"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.sheetButton,
                styles.sheetConfirm,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sheetConfirmLabel}>Log out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const badgeBackground = {
  success: { backgroundColor: "#F0FDF4" },
  danger: { backgroundColor: "#FEF2F2" },
  progress: { backgroundColor: colors.softYellow },
} as const;

const badgeInk = {
  success: { color: colors.success },
  danger: { color: colors.danger },
  progress: { color: colors.primaryInk },
} as const;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  header: {
    backgroundColor: colors.brightYellow,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  phone: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingBottom: 12,
  },
  column: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  option: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  optionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  optionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  notice: {
    borderRadius: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  noticeMessage: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  order: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 14,
    gap: 8,
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  orderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  orderTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  orderMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  summary: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  when: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  logoutDock: {
    gap: 8,
    paddingTop: 8,
    backgroundColor: colors.softBackground,
  },
  logout: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logoutLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: colors.text,
  },
  version: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.welcomeMuted,
  },
  pressed: {
    opacity: 0.78,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 23, 23, 0.4)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 10,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  sheetCopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  sheetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancel: {
    backgroundColor: colors.softBackground,
  },
  sheetConfirm: {
    backgroundColor: colors.primary,
  },
  sheetCancelLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  sheetConfirmLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
});
