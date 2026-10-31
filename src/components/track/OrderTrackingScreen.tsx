import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { readActiveOrder } from '@/data/activeOrder';
import type { CustomerOrder, OrderLine, OrderStatus } from '@/types/order';

const flow: OrderStatus[] = ['placed', 'confirmed', 'packing', 'picked_up', 'out_for_delivery', 'delivered'];

const statusCopy: Record<OrderStatus, { title: string; detail: string }> = {
  placed: { title: 'Your order is placed', detail: 'Waiting for the store to confirm it' },
  confirmed: { title: 'Your order is confirmed', detail: 'The store has accepted it' },
  packing: { title: 'Your order is getting packed', detail: 'Items are being prepared' },
  picked_up: { title: 'Order picked up', detail: 'The order has left the store' },
  out_for_delivery: { title: 'Out for delivery', detail: 'The order is on the way' },
  delivered: { title: 'Order delivered', detail: 'This order has been delivered' },
  cancelled: { title: 'Order cancelled', detail: 'This order is not on the way' },
};

export function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { orders } = usePreviewSession();
  const previewOrder = UI_PREVIEW_MODE ? orders[0] : undefined;
  const state = previewOrder ? ({ kind: 'ready', order: previewOrder } as const) : readActiveOrder();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
          <AppIcon name="close" color={colors.text} size={20} />
        </Pressable>
        <View style={styles.headerCopy}>
          {state.kind === 'ready' ? (
            <>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Order {state.order.id}
              </Text>
              <View style={styles.headerMeta}>
                <Pressable accessibilityRole="button" accessibilityLabel="View order details" onPress={() => setDetailsOpen(true)}>
                  <Text style={styles.headerLink}>View Details</Text>
                </Pressable>
                <Text style={styles.headerTime}>{state.order.placedAtLabel}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>Track order</Text>
              <Text style={styles.headerSubtitle}>GroceryApp</Text>
            </>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          accessibilityState={{ expanded: menuOpen }}
          hitSlop={8}
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <AppIcon name="menu" color={colors.white} size={18} />
        </Pressable>
      </View>

      {state.kind === 'ready' ? (
        <ActiveOrder order={state.order} detailsOpen={detailsOpen} onCloseDetails={() => setDetailsOpen(false)} />
      ) : state.kind === 'error' ? (
        <StatusMessage title="Tracking is unavailable" message={state.message} />
      ) : state.kind === 'loading' ? (
        <StatusMessage title="Checking for an order" message="Looking up the current order." />
      ) : (
        <StatusMessage
          title="No active order"
          message="Order tracking is not connected yet. An order number, arrival time, and delivery partner will appear here after an order is placed."
        />
      )}

      <View style={[styles.footer, { paddingBottom: 10 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help"
          onPress={() => router.push('/help')}
          style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
          <Text style={styles.helpLabel}>HELP</Text>
        </Pressable>
      </View>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

function ActiveOrder({
  order,
  detailsOpen,
  onCloseDetails,
}: {
  order: CustomerOrder;
  detailsOpen: boolean;
  onCloseDetails: () => void;
}) {
  const [itemsOpen, setItemsOpen] = useState(false);
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const copy = statusCopy[order.status];
  const phone = callablePhone(order.partner?.phone);
  const step = flow.indexOf(order.status);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.illustration}>
            <SoftIcon name="box" size={72} />
            <SoftIcon name="basket" size={48} />
          </View>
          {order.eta ? (
            <View style={styles.eta} accessibilityRole="text" accessibilityLabel={`Delivery estimate ${order.eta.value} ${order.eta.unit}`}>
              <Text style={styles.etaValue}>{order.eta.value}</Text>
              <Text style={styles.etaUnit}>{order.eta.unit}</Text>
            </View>
          ) : null}
          <Text style={styles.addressTitle}>{order.addressTitle}</Text>
          <Text style={styles.addressLine}>{order.addressLine}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.countLabel}>{itemsCaption(order.status, count)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={itemsOpen ? 'Hide items' : 'See all items'}
              onPress={() => setItemsOpen((open) => !open)}>
              <Text style={styles.link}>{itemsOpen ? 'Hide items' : 'See all items'}</Text>
            </Pressable>
          </View>
          {itemsOpen ? <ItemList items={order.items} /> : null}
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <SoftIcon name="box" size={22} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.cardTitle}>{copy.title}</Text>
              <Text style={styles.cardSub}>{order.statusDetail ?? copy.detail}</Text>
            </View>
          </View>
          {order.status === 'cancelled' ? null : (
            <View style={styles.progress} accessibilityRole="progressbar">
              {flow.map((status, index) => (
                <View key={status} style={[styles.progressStep, index <= step && styles.progressDone]} />
              ))}
            </View>
          )}
        </View>

        {order.partner ? (
          <View style={styles.card}>
            <View style={styles.partnerRow}>
              <View style={styles.avatar}>
                <SoftIcon name="profile" size={28} />
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.cardTitle}>{order.partner.name}</Text>
                <Text style={styles.cardSub}>{order.partner.status}</Text>
              </View>
              {phone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${order.partner.name}`}
                  onPress={() => void Linking.openURL(`tel:${phone}`)}
                  style={styles.call}>
                  <AppIcon name="phone" color={colors.white} size={16} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {order.offer ? (
          <View style={styles.wait}>
            <Text style={styles.waitTitle}>While you wait for your order...</Text>
            <View style={styles.offer}>
              <Text style={styles.offerTitle}>{order.offer.title}</Text>
              <Text style={styles.offerDetail}>{order.offer.detail}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <OrderDetails order={order} visible={detailsOpen} onClose={onCloseDetails} />
    </>
  );
}

function ItemList({ items }: { items: OrderLine[] }) {
  if (items.length === 0) {
    return <Text style={styles.cardSub}>No items were included with this order.</Text>;
  }
  return (
    <View style={styles.items}>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemQty}>
            {item.quantity}
            {item.unit ? ` · ${item.unit}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

function OrderDetails({
  order,
  visible,
  onClose,
}: {
  order: CustomerOrder;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const copy = statusCopy[order.status];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close order details" onPress={onClose} style={styles.backdrop} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.cardTitle}>Order {order.id}</Text>
        <Text style={styles.cardSub}>{order.placedAtLabel}</Text>
        <Text style={styles.cardTitle}>{copy.title}</Text>
        <Text style={styles.cardSub}>{order.addressTitle}</Text>
        <Text style={styles.addressLine}>{order.addressLine}</Text>
        <ItemList items={order.items} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={onClose} style={styles.sheetClose}>
          <Text style={styles.link}>Close</Text>
        </Pressable>
      </View>
      </View>
    </Modal>
  );
}

function StatusMessage({ title, message }: { title: string; message: string }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.empty} showsVerticalScrollIndicator={false}>
      <View style={styles.illustration}>
        <SoftIcon name="box" size={84} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{message}</Text>
    </ScrollView>
  );
}

function itemsCaption(status: OrderStatus, count: number) {
  const noun = count === 1 ? 'item' : 'items';
  if (status === 'packing') return `${count} ${noun} to be packed`;
  if (status === 'picked_up' || status === 'out_for_delivery') return `${count} ${noun} on the way`;
  if (status === 'delivered') return `${count} ${noun} delivered`;
  if (status === 'cancelled') return `${count} ${noun} cancelled`;
  return `${count} ${noun} in this order`;
}

function callablePhone(phone: string | undefined) {
  if (!phone) return null;
  const compact = phone.replace(/[\s()-]/g, '');
  return /^\+?[0-9]{6,15}$/.test(compact) ? compact : null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  header: {
    backgroundColor: colors.brightYellow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconSurface,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLink: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  headerTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 4,
  },
  illustration: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  eta: {
    width: 88,
    height: 88,
    marginTop: -28,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaValue: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
  },
  etaUnit: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  addressTitle: {
    marginTop: 8,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    textAlign: 'center',
  },
  addressLine: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  progress: {
    flexDirection: 'row',
    gap: 4,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDone: {
    backgroundColor: colors.primary,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  call: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  itemQty: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  wait: {
    marginHorizontal: 12,
    gap: 8,
  },
  waitTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  offer: {
    borderRadius: 16,
    backgroundColor: colors.brightYellow,
    padding: 16,
    gap: 4,
  },
  offerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  offerDetail: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  empty: {
    paddingHorizontal: 28,
    paddingTop: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  emptyCopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  helpButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(23, 23, 23, 0.4)',
  },
  sheet: {
    marginTop: 'auto',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 6,
  },
  sheetClose: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
});
