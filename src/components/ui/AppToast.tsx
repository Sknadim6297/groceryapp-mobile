import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { AuthTone } from '@/types/customerApi';

type ToastItem = {
  id: number;
  tone: AuthTone;
  message: string;
};

type ToastContextValue = {
  showToast: (tone: AuthTone, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyle: Record<AuthTone, { icon: AppIconName; ink: string; wash: string }> = {
  success: { icon: 'check', ink: colors.success, wash: '#F0FDF4' },
  error: { icon: 'close', ink: colors.danger, wash: '#FEF2F2' },
  warning: { icon: 'shield', ink: colors.primaryInk, wash: colors.softYellow },
  info: { icon: 'bell', ink: colors.text, wash: colors.white },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [shift] = useState(() => new Animated.Value(-16));
  const [opacity] = useState(() => new Animated.Value(0));
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(shift, { toValue: -16, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, shift]);

  const showToast = useCallback(
    (tone: AuthTone, message: string) => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      setToast({ id: Date.now(), tone, message });
      shift.setValue(-16);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      setHideTimer(setTimeout(hide, 3200));
    },
    [hide, hideTimer, opacity, shift],
  );

  useEffect(
    () => () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    },
    [hideTimer],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const look = toast ? toneStyle[toast.tone] : toneStyle.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, { top: Math.max(insets.top, 12) + 8, opacity, transform: [{ translateY: shift }] }]}>
          <Pressable
            accessibilityRole="alert"
            accessibilityLabel={toast.message}
            onPress={hide}
            style={[styles.card, { backgroundColor: look.wash, borderColor: look.ink }]}>
            <AppIcon name={look.icon} color={look.ink} size={16} />
            <Text style={styles.message}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return value;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    alignItems: 'center',
  },
  card: {
    maxWidth: 420,
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  message: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
});
