import { mapProductRecord } from '../src/services/productsApi';

async function run() {
  const response = await fetch('https://api.supertrading.online/api/values/products?company=8787888888');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error('Expected array');
  }

  let withImages = 0;
  for (const item of body) {
    const mapped = mapProductRecord(item);
    if (!mapped) {
      throw new Error('product failed to map');
    }
    if (
      typeof mapped.image === 'object' &&
      mapped.image != null &&
      'uri' in mapped.image &&
      typeof mapped.image.uri === 'string' &&
      mapped.image.uri.startsWith('data:image/')
    ) {
      withImages += 1;
    }
  }

  if (withImages === 0) {
    throw new Error('No products mapped with data:image sources — check API payload');
  }

  console.log(
    'live-products-images.test.ts: ok',
    `products=${body.length}`,
    `withDataImages=${withImages}`,
  );
}

void run();
