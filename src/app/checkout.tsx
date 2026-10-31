import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { previewCouponById } from '@/data/previewCoupons';
import { buildCartBill, formatRupee } from '@/utils/cartBill';

export default function CheckoutScreen() {
  const { quantities } = useMockCart();
  const { confirmed } = useDeliveryLocation();
  const { couponId } = usePreviewSession();
  const lines = Object.entries(quantities)
    .map(([id, quantity]) => {
      const product = findDemoProduct(id);
      return product ? { product, quantity } : null;
    })
    .filter((line): line is { product: NonNullable<ReturnType<typeof findDemoProduct>>; quantity: number } => line !== null);
  const bill = buildCartBill(lines);
  const coupon = UI_PREVIEW_MODE ? previewCouponById(couponId) : undefined;
  const couponOff = coupon && bill.subtotal >= coupon.minimum ? coupon.amount : 0;
  const payable = Math.max(0, bill.subtotal - couponOff);
  const address = confirmed ? formatDeliveryAddress(confirmed) : 'Select a delivery address';

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Checkout" message="Checkout is not connected yet." withHeader />;
  }

  return (
    <PreviewScaffold
      title="Checkout"
      subtitle="Simulated review. No order is sent."
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to simulated payment"
          disabled={lines.length === 0}
          onPress={() => router.push('/payment')}
          style={[styles.button, lines.length === 0 && styles.disabled]}>
          <Text style={styles.buttonLabel}>Continue to simulated payment</Text>
        </Pressable>
      }>
      <View style={styles.card}>
        <Text style={styles.heading}>Delivery</Text>
        <Text style={styles.body}>{address}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Change address" onPress={() => router.push('/location')}>
          <Text style={styles.link}>Change address</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Items</Text>
        {lines.length === 0 ? <Text style={styles.body}>Your preview cart is empty.</Text> : null}
        {lines.map((line) => (
          <View key={line.product.id} style={styles.row}>
            <Text style={styles.body}>
              {line.quantity} × {line.product.name}
            </Text>
            <Text style={styles.body}>{formatRupee(line.product.price * line.quantity)}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.heading}>Preview total</Text>
          <Text style={styles.heading}>{formatRupee(payable)}</Text>
        </View>
        {couponOff > 0 ? <Text style={styles.note}>{coupon?.title} is simulated and is not a live discount.</Text> : null}
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
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
});
