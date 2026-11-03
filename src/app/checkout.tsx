import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { computeDemoCouponDiscount, demoCouponById, isCouponExpired } from '@/data/demoCoupons';
import { addressesSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { formatRupee } from '@/utils/cartBill';
import { isCompleteDeliveryLocation } from '@/utils/deliveryAddress';
import { buildDemoCheckoutBill } from '@/utils/demoCheckoutBill';
import { useSavedAddresses } from '@/context/SavedAddressesContext';

export default function CheckoutScreen() {
  const { quantities, leaveAtDoor, setLeaveAtDoor } = useMockCart();
  const { confirmed, beginAddressBookPick } = useDeliveryLocation();
  const { addresses, hydrated } = useSavedAddresses();
  const { couponId } = usePreviewSession();
  const [instructions, setInstructions] = useState('');

  const lines = Object.entries(quantities)
    .map(([id, quantity]) => {
      const product = findDemoProduct(id);
      return product ? { product, quantity } : null;
    })
    .filter((line): line is { product: NonNullable<ReturnType<typeof findDemoProduct>>; quantity: number } => line !== null);

  const coupon =
    UI_PREVIEW_MODE && couponId
      ? (() => {
          const found = demoCouponById(couponId);
          return found && !isCouponExpired(found) ? found : undefined;
        })()
      : undefined;
  const provisional = buildDemoCheckoutBill(lines, 0);
  const couponOff = coupon ? computeDemoCouponDiscount(coupon, provisional.itemTotal) : 0;
  const bill = buildDemoCheckoutBill(lines, couponOff);
  const complete = isCompleteDeliveryLocation(confirmed);
  const address = complete && confirmed ? formatDeliveryAddress(confirmed) : 'Select a complete delivery address';

  function openAddressFlow() {
    if (hydrated && addresses.length > 0) {
      router.push(addressesSelectHref());
      return;
    }
    // Add-address path: Set Location → address form (do not also beginLocationEdit; that clears the pick).
    beginAddressBookPick({ selectMode: true, returnTo: '/checkout' });
    router.push(locationRoutes.search);
  }

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Checkout" message="Checkout is not connected yet." withHeader />;
  }

  return (
    <PreviewScaffold
      title="Checkout"
      subtitle="Demo checkout review. No order is sent to a store."
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to Payment"
          disabled={lines.length === 0 || !complete}
          onPress={() => {
            if (!complete) {
              openAddressFlow();
              return;
            }
            router.push('/payment');
          }}
          style={[styles.button, (lines.length === 0 || !complete) && styles.disabled]}>
          <Text style={styles.buttonLabel}>Continue to Payment · {formatRupee(bill.grandTotal)}</Text>
        </Pressable>
      }>
      <DemoBanner message="Simulated checkout — payment providers are not contacted." />

      <View style={styles.card}>
        <Text style={styles.heading}>Delivery address</Text>
        <Text style={styles.body}>{address}</Text>
        {!complete ? (
          <Text style={styles.hint}>A house-level address with city and PIN is required before checkout.</Text>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Change address" onPress={openAddressFlow}>
          <Text style={styles.link}>{complete ? 'Change address' : 'Add delivery address'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Cart summary</Text>
        {lines.length === 0 ? <Text style={styles.body}>Your cart is empty.</Text> : null}
        {lines.map((line) => (
          <View key={line.product.id} style={styles.row}>
            <Text style={styles.body}>
              {line.quantity} × {line.product.name}
            </Text>
            <Text style={styles.body}>{formatRupee(line.product.price * line.quantity)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Delivery instructions</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Optional notes for the delivery partner (demo only)"
          placeholderTextColor={colors.textSecondary}
          multiline
          style={styles.input}
          accessibilityLabel="Delivery instructions"
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: leaveAtDoor }}
          onPress={() => setLeaveAtDoor(!leaveAtDoor)}
          style={styles.checkRow}>
          <View style={[styles.check, leaveAtDoor && styles.checkOn]} />
          <Text style={styles.body}>Leave at door (demo preference)</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Coupon</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/coupons')}>
          <Text style={styles.link}>
            {coupon ? `${coupon.title} applied (simulated)` : 'Select a demo promocode'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.body}>Subtotal</Text>
          <Text style={styles.body}>{formatRupee(bill.itemTotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.body}>Delivery charge (demo)</Text>
          <Text style={styles.body}>{formatRupee(bill.deliveryFee)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.body}>Discount (demo)</Text>
          <Text style={styles.body}>-{formatRupee(bill.discount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.heading}>Grand total</Text>
          <Text style={styles.heading}>{formatRupee(bill.grandTotal)}</Text>
        </View>
      </View>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  body: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  input: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  button: {
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
});
