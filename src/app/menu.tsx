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
      message={
        name
          ? `Coming Soon. ${name} is not connected yet.`
          : 'Coming Soon. This menu action is not available yet.'
      }
      withHeader
    />
  );
}
