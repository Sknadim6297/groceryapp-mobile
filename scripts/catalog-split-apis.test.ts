import { fetchCategories, fetchProductImages, fetchSubcategories } from '../src/services/catalogMetaApi';
import { fetchProducts, __resetProductsFetchStateForTests } from '../src/services/productsApi';

async function run() {
  __resetProductsFetchStateForTests();

  const products = await fetchProducts('8787888888', { force: true });
  if (!products.ok) {
    throw new Error(`products failed: ${products.message}`);
  }
  if (products.products.length === 0) {
    throw new Error('expected products');
  }
  // List mode: each product should keep a single primary image slot.
  for (const product of products.products) {
    if (product.images.length !== 1) {
      throw new Error(`product ${product.id} should have 1 list image, got ${product.images.length}`);
    }
  }

  const categories = await fetchCategories('8787888888');
  if (!categories.ok) {
    throw new Error(`categories failed: ${categories.message}`);
  }
  if (categories.categories.length === 0) {
    throw new Error('expected categories');
  }

  const firstCategory = products.products.find((p) => p.category)?.category;
  if (!firstCategory) {
    throw new Error('need a product with category for subcategory probe');
  }
  const subs = await fetchSubcategories(firstCategory, '8787888888');
  if (!subs.ok) {
    throw new Error(`subcategories failed: ${subs.message}`);
  }
  if (subs.subcategories.length === 0) {
    throw new Error('expected subcategories');
  }

  const withImage = products.products.find((p) => {
    const uri =
      typeof p.image === 'object' && p.image && 'uri' in p.image ? String(p.image.uri) : '';
    return uri.startsWith('data:image/');
  });
  if (!withImage) {
    throw new Error('expected at least one product with Image1');
  }
  const gallery = await fetchProductImages(withImage.id, '8787888888');
  if (!gallery.ok) {
    throw new Error(`productimages failed: ${gallery.message}`);
  }

  console.log(
    'catalog-split-apis.test.ts: ok',
    `products=${products.products.length}`,
    `categories=${categories.categories.length}`,
    `subcategories=${subs.subcategories.length}`,
    `extraImages=${gallery.images.length}`,
  );
}

void run();
