import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

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

const methods = ['Simulated UPI', 'Simulated card', 'Simulated cash'] as const;

export default function PaymentScreen() {
  const { quantities, setQuantity } = useMockCart();
  const { confirmed } = useDeliveryLocation();
  const { couponId, placeOrder } = usePreviewSession();
  const [method, setMethod] = useState<(typeof methods)[number]>(methods[0]);
  const lines = Object.entries(quantities)
    .map(([id, quantity]) => {
      const product = findDemoProduct(id);
      return product ? { product, quantity } : null;
    })
    .filter((line): line is { product: NonNullable<ReturnType<typeof findDemoProduct>>; quantity: number } => line !== null);
  const bill = buildCartBill(lines);
  const coupon = previewCouponById(couponId);
  const couponOff = coupon && bill.subtotal >= coupon.minimum ? coupon.amount : 0;
  const payable = Math.max(0, bill.subtotal - couponOff);

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Payment" message="Payment is not connected yet. No charge will be made." withHeader />;
  }

  function place() {
    if (lines.length === 0) {
      return;
    }
    const id = `SIM-${String(Date.now()).slice(-6)}`;
    placeOrder({
      id,
      placedAtLabel: 'Just now · simulated',
      status: 'packing',
      statusDetail: 'Simulated. This order was not sent to a store.',
      addressTitle: confirmed?.label ? `Delivery to ${confirmed.label}` : 'Delivery address',
      addressLine: confirmed ? formatDeliveryAddress(confirmed) : 'No address selected',
      items: lines.map((line) => ({
        id: line.product.id,
        name: line.product.name,
        quantity: line.quantity,
        unit: line.product.unit,
      })),
      total: payable,
      paymentLabel: method,
    });
    for (const line of lines) {
      setQuantity(line.product.id, 0);
    }
    router.replace({ pathname: '/order-confirmed', params: { id } });
  }

  return (
    <PreviewScaffold
      title="Payment"
      subtitle="Simulated. No charge is made."
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Place simulated order"
          disabled={lines.length === 0}
          onPress={place}
          style={[styles.button, lines.length === 0 && styles.disabled]}>
          <Text style={styles.buttonLabel}>Place simulated order · {formatRupee(payable)}</Text>
        </Pressable>
      }>
      <Text style={styles.note}>Choose a preview method. GroceryApp will not contact a bank or payment provider.</Text>
      {methods.map((option) => {
        const selected = method === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setMethod(option)}
            style={[styles.option, selected && styles.optionOn]}>
            <Text style={styles.optionLabel}>{option}</Text>
          </Pressable>
        );
      })}
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  option: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionOn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  optionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
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
