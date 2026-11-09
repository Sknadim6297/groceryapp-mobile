const base = 'https://api.supertrading.online';
const paths = [
  '/api/values/catalog/categories',
  '/api/values/catalog/home',
  '/api/values/categories',
  '/api/values/banners',
  '/api/values/fields',
  '/api/values/products?company=8787888888',
];

async function run() {
  for (const path of paths) {
    try {
      const response = await fetch(`${base}${path}`, { method: 'GET' });
      const text = await response.text();
      console.log(`GET ${response.status} ${path} body=${text.slice(0, 80).replace(/\s+/g, ' ')}`);
    } catch (error) {
      console.log(`GET ERR ${path} ${String(error)}`);
    }
  }
}

void run();
