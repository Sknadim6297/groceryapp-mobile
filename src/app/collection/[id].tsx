import { Redirect, useLocalSearchParams } from 'expo-router';

import { CategoryShoppingScreen } from '@/components/collection/CategoryShoppingScreen';
import { getShoppingCollection, isShoppingCollectionId } from '@/data/shoppingCollections';
import { decodeShopFilters, decodeShopSort } from '@/utils/shopListingParams';

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default function CollectionRoute() {
  const { id, q, sort, filters } = useLocalSearchParams<{
    id?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    filters?: string | string[];
  }>();
  const collectionId = firstParam(id);
  const routeQuery = firstParam(q);
  const routeSort = decodeShopSort(firstParam(sort) || undefined);
  const routeFilters = decodeShopFilters(firstParam(filters) || undefined);
  const listingSeedKey = `${collectionId}|${firstParam(filters)}|${firstParam(sort)}`;

  if (!isShoppingCollectionId(collectionId) || !getShoppingCollection(collectionId)) {
    return <Redirect href="/home" />;
  }

  return (
    <CategoryShoppingScreen
      collectionId={collectionId}
      seedQuery={routeQuery}
      seedSort={routeSort}
      seedFilters={routeFilters}
      seedKey={listingSeedKey}
    />
  );
}
