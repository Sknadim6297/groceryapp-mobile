export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number;
  completed: boolean;
  /**
   * Catalogue product id when the item name matched exactly (case-insensitive).
   * Null/undefined means unmatched — never auto-filled with a near miss.
   */
  matchedProductId?: string | null;
};

export type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingListItem[];
  updatedAt: number;
};
