import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function MenuScreen() {
  const { section } = useLocalSearchParams<{ section?: string | string[] }>();
  const name = firstParam(section)?.trim().slice(0, 40);

  return (
    <PlaceholderScreen
      title={name || 'Menu'}
      message={name ? `${name} is not connected yet.` : 'This is a placeholder. Menu actions are not available yet.'}
      withHeader
    />
  );
}
