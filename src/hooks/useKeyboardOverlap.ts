import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';

/**
 * Height of the window still covered by the keyboard.
 * Returns 0 when the window already resized, so padding is not applied twice.
 * Web has no system keyboard inset.
 */
export function useKeyboardOverlap(): number {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    function onShow(event: KeyboardEvent) {
      const windowHeight = Dimensions.get('window').height;
      const covered = Math.max(0, Math.round(windowHeight - event.endCoordinates.screenY));
      setOverlap(covered);
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, onShow);
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return overlap;
}
