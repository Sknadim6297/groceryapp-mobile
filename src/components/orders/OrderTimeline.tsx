import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { OrderTimelineStep } from '@/utils/orderListing';

type OrderTimelineProps = {
  steps: readonly OrderTimelineStep[];
};

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const active = step.state === 'done' || step.state === 'current';
        const cancelled = step.state === 'cancelled';
        return (
          <View key={step.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                  cancelled && styles.dotCancelled,
                  step.state === 'pending' && styles.dotPending,
                ]}
              />
              {!last ? (
                <View style={[styles.line, active && !cancelled ? styles.lineActive : styles.lineMuted]} />
              ) : null}
            </View>
            <View style={[styles.copy, last && styles.copyLast]}>
              <Text
                style={[
                  styles.label,
                  step.state === 'pending' && styles.labelPending,
                  cancelled && styles.labelCancelled,
                ]}
                numberOfLines={2}>
                {step.label}
              </Text>
              {step.at ? (
                <Text style={styles.at} numberOfLines={2}>
                  {step.at}
                </Text>
              ) : (
                <Text style={styles.atMuted}>{step.state === 'pending' ? 'Pending' : '—'}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    minHeight: 36,
  },
  rail: {
    width: 18,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
  },
  dotActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  dotCancelled: {
    borderColor: colors.danger,
    backgroundColor: '#FECACA',
  },
  dotPending: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
    borderRadius: 1,
  },
  lineActive: {
    backgroundColor: colors.primary,
  },
  lineMuted: {
    backgroundColor: '#E5E7EB',
  },
  copy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 14,
    paddingLeft: 10,
  },
  copyLast: {
    paddingBottom: 4,
  },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  labelPending: {
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  labelCancelled: {
    color: colors.danger,
  },
  at: {
    maxWidth: '46%',
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  atMuted: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#94A3B8',
  },
});
