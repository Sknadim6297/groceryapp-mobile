import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
const VISIBLE_MS = 2800;
const MAX_CHARS = 88;

const toneStyle: Record<AuthTone, { icon: AppIconName; ink: string; wash: string }> = {
  success: { icon: 'check', ink: colors.success, wash: '#F0FDF4' },
  error: { icon: 'close', ink: colors.danger, wash: '#FEF2F2' },
  warning: { icon: 'shield', ink: colors.primaryInk, wash: colors.softYellow },
  info: { icon: 'bell', ink: colors.text, wash: colors.white },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (tone: AuthTone, message: string) => {
      const compact = message.replace(/\s+/g, ' ').trim();
      const text = compact.length > MAX_CHARS ? `${compact.slice(0, MAX_CHARS - 1).trimEnd()}…` : compact;
      if (text.length === 0) {
        return;
      }
      const id = nextId.current + 1;
      nextId.current = id;
      timers.current.forEach((timer) => {
        clearTimeout(timer);
      });
      timers.current.clear();
      setToasts([{ id, tone, message: text }]);
      timers.current.set(
        id,
        setTimeout(() => {
          dismiss(id);
        }, VISIBLE_MS),
      );
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => {
        clearTimeout(timer);
      });
      timers.current.clear();
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        collapsable={false}
        style={[styles.overlay, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const look = toneStyle[toast.tone];
  const [shift] = useState(() => new Animated.Value(-12));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Native driver is unavailable on web (no RCTAnimation) — avoid the console warning.
    const useNativeDriver = Platform.OS !== 'web';
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver }),
      Animated.timing(shift, { toValue: 0, duration: 180, useNativeDriver }),
    ]);
    animation.start();
    return () => {
      animation.stop();
    };
  }, [opacity, shift]);

  return (
    <Animated.View pointerEvents="box-none" style={{ opacity, transform: [{ translateY: shift }] }}>
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={toast.message}
        onPress={() => onDismiss(toast.id)}
        style={[styles.card, { backgroundColor: look.wash, borderColor: look.ink }]}>
        <AppIcon name={look.icon} color={look.ink} size={16} />
        <Text maxFontSizeMultiplier={1.1} numberOfLines={2} style={styles.message}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
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
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
  },
  card: {
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
});
