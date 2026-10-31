import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';

const DEMO_SAVE = 100;
const DEMO_WORTH = 240;
const DEMO_GOAL = 3;
const DEMO_STEP = 2;

export function SavingsProgressStrip() {
  const { totalCount } = useMockCart();

  if (!UI_PREVIEW_MODE) {
    return null;
  }

  const step = totalCount > 0 ? Math.min(totalCount, DEMO_GOAL) : DEMO_STEP;
  const progress = step / DEMO_GOAL;

  return (
    <View
      style={styles.strip}
      accessibilityRole="summary"
      accessibilityLabel={`Demo offer. Save ${DEMO_SAVE} rupees more by adding items worth ${DEMO_WORTH} rupees. Progress ${step} of ${DEMO_GOAL}. This is not a live discount.`}>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>Save ₹{DEMO_SAVE} more</Text>
          <Text style={styles.detail}>by adding items worth ₹{DEMO_WORTH}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View items in the basket"
          onPress={() => router.push('/cart')}
          hitSlop={6}
          style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.action}>View Items</Text>
        </Pressable>
        <Text style={styles.fraction}>
          {step}/{DEMO_GOAL}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.white,
    paddingBottom: 8,
  },
  track: {
    height: 3,
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
  },
  fill: {
    height: 3,
    backgroundColor: '#22C55E',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 7,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  detail: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: '#6B7280',
  },
  action: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.success,
  },
  fraction: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.7,
  },
});
