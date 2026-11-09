import { mapProductRecord } from '../src/services/productsApi';
import { deriveLiveCategoryTree } from '../src/utils/liveCatalogMeta';

async function run() {
  const response = await fetch('https://api.supertrading.online/api/values/products?company=8787888888');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error('Expected products array');
  }

  const products = body
    .map((row) => mapProductRecord(row))
    .filter((row): row is NonNullable<typeof row> => row != null);

  const tree = deriveLiveCategoryTree(products);
  for (const parent of tree) {
    const imageHint =
      typeof parent.image === 'object' && parent.image != null && 'uri' in parent.image
        ? String(parent.image.uri).startsWith('data:')
          ? 'data:image'
          : String(parent.image.uri).slice(0, 48) || 'empty'
        : 'empty';
    console.log(`FIELD\t${parent.name}\t${parent.id}\t${imageHint}`);
    for (const child of parent.children) {
      const childHint =
        typeof child.image === 'object' && child.image != null && 'uri' in child.image
          ? String(child.image.uri).startsWith('data:')
            ? 'data:image'
            : String(child.image.uri).slice(0, 48) || 'empty'
          : 'empty';
      console.log(`  CAT\t${child.name}\t${child.id}\tcount=${child.productCount}\t${childHint}`);
    }
  }

  const withCatImg = products.filter(
    (product) =>
      typeof product.categoryImage === 'object' &&
      product.categoryImage != null &&
      'uri' in product.categoryImage &&
      typeof product.categoryImage.uri === 'string' &&
      product.categoryImage.uri.length > 0,
  ).length;
  const withSubImg = products.filter(
    (product) =>
      typeof product.subcategoryImage === 'object' &&
      product.subcategoryImage != null &&
      'uri' in product.subcategoryImage &&
      typeof product.subcategoryImage.uri === 'string' &&
      product.subcategoryImage.uri.length > 0,
  ).length;

  console.log(
    `SUMMARY\tproducts=${products.length}\tfields=${tree.length}\twithCategoryImage=${withCatImg}\twithSubcategoryImage=${withSubImg}`,
  );
}

void run();
