import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { BRAND_NAME } from '@/constants/brand';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { computeDemoCouponDiscount, demoCouponById, isCouponExpired } from '@/data/demoCoupons';
import { formatRupee } from '@/utils/cartBill';
import { buildDemoCheckoutBill, createDemoOrderId } from '@/utils/demoCheckoutBill';

const methods: { id: string; label: string; detail: string; icon: AppIconName }[] = [
  { id: 'cod', label: 'Cash on Delivery', detail: 'Pay when the order arrives (demo)', icon: 'bag' },
  { id: 'upi', label: 'UPI', detail: 'Simulated UPI — no bank call', icon: 'phone' },
  { id: 'card', label: 'Debit / Credit Card', detail: 'Simulated card — no charge', icon: 'card' },
];

export default function PaymentScreen() {
  const { quantities, setQuantity } = useMockCart();
  const { confirmed } = useDeliveryLocation();
  const { couponId, placeOrder } = usePreviewSession();
  const [methodId, setMethodId] = useState(methods[0]!.id);

  const lines = Object.entries(quantities)
    .map(([id, quantity]) => {
      const product = findDemoProduct(id);
      return product ? { product, quantity } : null;
    })
    .filter((line): line is { product: NonNullable<ReturnType<typeof findDemoProduct>>; quantity: number } => line !== null);

  const foundCoupon = demoCouponById(couponId);
  const coupon = foundCoupon && !isCouponExpired(foundCoupon) ? foundCoupon : undefined;
  const provisional = buildDemoCheckoutBill(lines, 0);
  const couponOff = coupon ? computeDemoCouponDiscount(coupon, provisional.itemTotal) : 0;
  const bill = buildDemoCheckoutBill(lines, couponOff);
  const method = methods.find((entry) => entry.id === methodId) ?? methods[0]!;

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Payment"
        message="Payment is not connected yet. No charge will be made."
        withHeader
      />
    );
  }

  return (
    <PreviewScaffold
      title="Payment"
      subtitle={`${BRAND_NAME} demo payment. No charge is made.`}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Place demo order"
          disabled={lines.length === 0}
          onPress={() => {
            if (lines.length === 0 || !UI_PREVIEW_MODE) {
              return;
            }
            const id = createDemoOrderId();
            placeOrder({
              id,
              placedAtLabel: 'Just now · demo',
              status: 'confirmed',
              statusDetail: 'Demo confirmation. This order was not sent to a store or payment provider.',
              statusAt: {
                placed: 'Just now',
                confirmed: 'Just now',
              },
              addressTitle: confirmed?.label ? `Delivery to ${confirmed.label}` : 'Delivery address',
              addressLine: confirmed ? formatDeliveryAddress(confirmed) : 'No address selected',
              items: lines.map((line) => ({
                id: line.product.id,
                name: line.product.name,
                quantity: line.quantity,
                unit: line.product.unit,
              })),
              totalAmount: bill.grandTotal,
              total: bill.grandTotal,
              paymentLabel: `Demo · ${method.label}`,
              partner: { name: 'Demo Partner', status: 'Assigned (preview)' },
            });
            for (const line of lines) {
              setQuantity(line.product.id, 0);
            }
            router.replace({ pathname: '/order-confirmed', params: { id } });
          }}
          style={[styles.button, lines.length === 0 && styles.disabled]}>
          <Text style={styles.buttonLabel}>Continue · Place demo order · {formatRupee(bill.grandTotal)}</Text>
        </Pressable>
      }>
      <DemoBanner message="Simulation only — banks and gateways are not contacted." />

      <View style={styles.card}>
        <Text style={styles.heading}>Order total (demo)</Text>
        <Text style={styles.total}>{formatRupee(bill.grandTotal)}</Text>
        <Text style={styles.note}>Includes simulated delivery and coupon math for UI preview.</Text>
      </View>

      <Text style={styles.section}>Payment method</Text>
      {methods.map((option) => {
        const selected = option.id === methodId;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setMethodId(option.id)}
            style={[styles.option, selected && styles.optionOn]}>
            <View style={styles.optionIcon}>
              <AppIcon name={option.icon} color={colors.text} size={18} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDetail}>{option.detail}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioOn]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  total: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  option: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionOn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  optionDetail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.primaryDark,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  button: {
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
});
