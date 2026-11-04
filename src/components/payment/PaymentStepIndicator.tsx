import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '@/constants/theme';

const STEPS = ['Cart', 'Checkout', 'Payment'] as const;

type PaymentStepIndicatorProps = {
  /** 0-based index of the active step. */
  activeIndex?: number;
};

export function PaymentStepIndicator({ activeIndex = 2 }: PaymentStepIndicatorProps) {
  return (
    <View style={styles.row} accessibilityRole="summary" accessibilityLabel="Cart, Checkout, Payment">
      {STEPS.map((label, index) => {
        const active = index === activeIndex;
        const done = index < activeIndex;
        return (
          <View key={label} style={styles.stepWrap}>
            {index > 0 ? <View style={[styles.connector, (done || active) && styles.connectorOn]} /> : null}
            <View style={[styles.pill, active && styles.pillActive, done && styles.pillDone]}>
              <Text style={[styles.label, (active || done) && styles.labelOn]}>{label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 0,
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    width: 14,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  connectorOn: {
    backgroundColor: colors.primaryDark,
  },
  pill: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pillDone: {
    backgroundColor: colors.softYellow,
    borderColor: colors.primaryDark,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  labelOn: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
});
