import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribe() {
  return () => {};
}

/**
 * Static web rendering uses light until the client snapshot is read.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();

  return useSyncExternalStore(
    subscribe,
    () => colorScheme ?? 'light',
    () => 'light',
  );
}
