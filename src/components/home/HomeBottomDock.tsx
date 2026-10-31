import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeFloatingNav } from '@/components/home/HomeFloatingNav';
import { SavingsProgressStrip } from '@/components/home/SavingsProgressStrip';

type HomeBottomDockProps = {
  width: number;
  onBuyAgain: () => void;
  onHeight: (height: number) => void;
};

export function HomeBottomDock({ width, onBuyAgain, onHeight }: HomeBottomDockProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const bottom = Math.max(insets.bottom, 8);
  const onHome = pathname === '/home';

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const doc = (
      globalThis as {
        document?: {
          addEventListener: (type: string, listener: (event: { target: EventTarget | null }) => void) => void;
          removeEventListener: (type: string, listener: (event: { target: EventTarget | null }) => void) => void;
        };
      }
    ).document;
    if (!doc) {
      return;
    }
    const show = (event: { target: EventTarget | null }) => {
      const tag = (event.target as { tagName?: string } | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        setKeyboardOpen(true);
      }
    };
    const hide = () => setKeyboardOpen(false);
    doc.addEventListener('focusin', show);
    doc.addEventListener('focusout', hide);
    return () => {
      doc.removeEventListener('focusin', show);
      doc.removeEventListener('focusout', hide);
    };
  }, []);

  useEffect(() => {
    if (keyboardOpen) {
      onHeight(0);
    }
  }, [keyboardOpen, onHeight]);

  if (!onHome || keyboardOpen) {
    return null;
  }

  return (
    <View
      style={styles.dock}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      pointerEvents="box-none">
      <View style={[styles.sheet, { width, paddingBottom: bottom }]}>
        <SavingsProgressStrip />
        <HomeFloatingNav onBuyAgain={onBuyAgain} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  sheet: {
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
  },
});
