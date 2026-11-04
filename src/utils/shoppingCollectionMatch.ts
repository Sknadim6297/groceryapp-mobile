import type { ShoppingCollectionId } from '@/types/shoppingCollection';

const FRESH_SHELF_IDS = new Set(['fruits', 'dairy-eggs']);
const DIWALI_SHELF_IDS = new Set(['preview-dry-fruits', 'snacks', 'preview-sweets', 'masala']);
const ELECTRONICS_SHELF_IDS = new Set(['preview-electronics', 'preview-kitchen']);

export function isOrganicCatalogSignal(name: string, brand: string): boolean {
  return /\borganic\b/i.test(name) || /\borganic\b/i.test(brand);
}

export function isDiwaliCatalogCandidate(shelfId: string | undefined, productName: string): boolean {
  if (shelfId && DIWALI_SHELF_IDS.has(shelfId)) {
    return true;
  }
  return /\b(cashews?|almonds?|makhana|sweets?|mithai|diyas?|namkeen)\b/i.test(productName);
}

export function isElectronicsCatalogCandidate(shelfId: string | undefined): boolean {
  return Boolean(shelfId && ELECTRONICS_SHELF_IDS.has(shelfId));
}

export function isFreshCatalogCandidate(shelfId: string | undefined): boolean {
  return Boolean(shelfId && FRESH_SHELF_IDS.has(shelfId));
}

export function chipIdsForCollectionProduct(args: {
  collectionId: ShoppingCollectionId;
  shelfId?: string;
  productName: string;
}): string[] {
  const { collectionId, shelfId, productName } = args;
  switch (collectionId) {
    case 'all':
      return [shelfId ?? 'more'];
    case 'fresh':
      return shelfId ? [shelfId] : [];
    case 'diwali': {
      if (shelfId === 'preview-dry-fruits' || /\b(cashews?|almonds?|makhana)\b/i.test(productName)) {
        return ['dry-fruits'];
      }
      if (shelfId === 'snacks' || /\bnamkeen\b/i.test(productName)) {
        return ['snacks'];
      }
      if (shelfId === 'preview-sweets' || /\b(sweets?|mithai)\b/i.test(productName)) {
        return ['sweets'];
      }
      return ['festive'];
    }
    case 'electronics':
      return [shelfId ?? 'electronics'];
    case 'organic':
      return [shelfId ?? 'organic'];
    default:
      return [];
  }
}

export function productBelongsToCollection(args: {
  collectionId: ShoppingCollectionId;
  shelfId?: string;
  productName: string;
  brand: string;
  diwaliSeasonActive: boolean;
}): boolean {
  const { collectionId, shelfId, productName, brand, diwaliSeasonActive } = args;
  switch (collectionId) {
    case 'all':
      return true;
    case 'fresh':
      return isFreshCatalogCandidate(shelfId);
    case 'diwali':
      return diwaliSeasonActive && isDiwaliCatalogCandidate(shelfId, productName);
    case 'electronics':
      return isElectronicsCatalogCandidate(shelfId);
    case 'organic':
      return isOrganicCatalogSignal(productName, brand);
    default:
      return false;
  }
}
