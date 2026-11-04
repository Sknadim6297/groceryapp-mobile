import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, space } from '@/constants/theme';
import type { OrderTimelineStep } from '@/utils/orderListing';

type OrderTimelineProps = {
  steps: readonly OrderTimelineStep[];
};

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const done = step.state === 'done';
        const current = step.state === 'current';
        const cancelled = step.state === 'cancelled';
        const pending = step.state === 'pending';
        return (
          <View key={step.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                  cancelled && styles.dotCancelled,
                  pending && styles.dotPending,
                ]}>
                {done ? <AppIcon name="check" color={colors.text} size={11} /> : null}
                {current ? <View style={styles.currentCore} /> : null}
                {cancelled ? <AppIcon name="close" color={colors.danger} size={11} /> : null}
              </View>
              {!last ? (
                <View
                  style={[
                    styles.line,
                    (done || current) && !cancelled ? styles.lineActive : styles.lineMuted,
                  ]}
                />
              ) : null}
            </View>
            <View style={[styles.copy, last && styles.copyLast]}>
              <View style={styles.copyMain}>
                <Text
                  style={[
                    styles.label,
                    pending && styles.labelPending,
                    cancelled && styles.labelCancelled,
                    current && styles.labelCurrent,
                  ]}
                  numberOfLines={2}>
                  {step.label}
                </Text>
                {current ? (
                  <View style={styles.nowPill}>
                    <Text style={styles.nowLabel}>Now</Text>
                  </View>
                ) : null}
              </View>
              {step.at ? (
                <Text style={styles.at} numberOfLines={2}>
                  {step.at}
                </Text>
              ) : (
                <Text style={styles.atMuted}>{pending ? 'Pending' : '—'}</Text>
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
    paddingTop: 2,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    minHeight: 40,
  },
  rail: {
    width: 22,
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 1,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.white,
  },
  currentCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDark,
  },
  dotCancelled: {
    borderColor: colors.danger,
    backgroundColor: '#FEE2E2',
  },
  dotPending: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F8FAFC',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 3,
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
    gap: space.sm,
    paddingBottom: 16,
    paddingLeft: space.sm,
  },
  copyLast: {
    paddingBottom: 2,
  },
  copyMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  labelCurrent: {
    fontFamily: fonts.bold,
  },
  labelPending: {
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  labelCancelled: {
    color: colors.danger,
  },
  nowPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.softYellow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
  },
  nowLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.primaryInk,
  },
  at: {
    maxWidth: '42%',
    textAlign: 'right',
    fontFamily: fonts.medium,
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
