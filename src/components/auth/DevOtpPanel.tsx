import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { DevMockCustomerStatus, DevOtpView } from '@/services/devOtp';

type DevOtpPanelProps = {
  otp: DevOtpView;
  onStatus: (status: DevMockCustomerStatus) => void;
};

function remainingLabel(otp: DevOtpView, now: number): string {
  if (otp.used) {
    return 'Already used once. Resend OTP creates a new code.';
  }
  if (otp.locked) {
    return 'Locked after too many incorrect attempts. Resend OTP creates a new code.';
  }
  const remaining = otp.expiresAt - now;
  if (remaining <= 0) {
    return 'Expired. Resend OTP creates a new code.';
  }
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Expires in ${minutes}:${seconds.toString().padStart(2, '0')} · ${otp.attemptsRemaining} attempts left`;
}

export function DevOtpPanel({ otp, onStatus }: DevOtpPanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const locked = otp.used || otp.locked;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View accessibilityRole="summary" style={styles.panel} testID="dev-otp-panel">
      <Text style={styles.demoBadge}>Demo / Development — not a real SMS</Text>
      <View style={styles.codeRow}>
        <Text style={styles.kicker}>Development OTP</Text>
        <Text accessibilityLabel={`Development test code ${otp.code.split('').join(' ')}`} style={styles.code}>
          {otp.code}
        </Text>
      </View>
      <Text style={styles.note}>{remainingLabel(otp, now)} Type it in the boxes.</Text>
      <View style={styles.statusRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens Complete Profile after the test code matches"
          accessibilityState={{ selected: otp.mockStatus === 'unregistered', disabled: locked }}
          disabled={locked}
          onPress={() => onStatus('unregistered')}
          style={({ pressed }) => [
            styles.status,
            otp.mockStatus === 'unregistered' && styles.statusOn,
            pressed && !locked && styles.pressed,
          ]}
          testID="dev-mock-new">
          <Text style={styles.statusLabel}>New customer</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens Home after the test code matches"
          accessibilityState={{ selected: otp.mockStatus === 'registered', disabled: locked }}
          disabled={locked}
          onPress={() => onStatus('registered')}
          style={({ pressed }) => [
            styles.status,
            otp.mockStatus === 'registered' && styles.statusOn,
            pressed && !locked && styles.pressed,
          ]}
          testID="dev-mock-registered">
          <Text style={styles.statusLabel}>Registered</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  demoBadge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kicker: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: 2,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  status: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statusOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  statusLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
