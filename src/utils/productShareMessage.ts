/**
 * Builds a native share message with the in-app deep link.
 * Does not invent a public website URL.
 */
export function buildProductShareMessage(input: {
  productId: string;
  productName: string;
  scheme?: string;
}): string {
  const id = input.productId.trim();
  const name = input.productName.trim() || 'Product';
  const scheme = (input.scheme ?? 'groceryapp').trim() || 'groceryapp';
  const link = `${scheme}://product/${encodeURIComponent(id)}`;
  return `${name}\nOpen in Mayapur Bazaar:\n${link}`;
}

export function productShareDeepLink(productId: string, scheme = 'groceryapp'): string {
  return `${scheme}://product/${encodeURIComponent(productId.trim())}`;
}
