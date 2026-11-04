import { Redirect, useLocalSearchParams } from 'expo-router';

import { CategoryShoppingScreen } from '@/components/collection/CategoryShoppingScreen';
import { getShoppingCollection, isShoppingCollectionId } from '@/data/shoppingCollections';

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default function CollectionRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const collectionId = firstParam(id);

  if (!isShoppingCollectionId(collectionId) || !getShoppingCollection(collectionId)) {
    return <Redirect href="/home" />;
  }

  return <CategoryShoppingScreen collectionId={collectionId} />;
}
