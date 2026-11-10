# Backend Fix Requests — MayapurBazaar product catalogue

**Date:** 2026-11-10  
**App:** MayapurBazaar (Expo / React Native)  
**API host:** `https://api.supertrading.online`

Only items below are **verified** against live responses. Suggested improvements that were not measured as failures are listed separately as evaluations.

---

## 1. Oversized product list payload (CRITICAL)

### Exact endpoint

`GET /api/values/products?company=8787888888`

### Reproduction steps

1. Call the endpoint above from any HTTP client.  
2. Observe response size and time.  
3. Repeat — size stays ~51 MB for 11 products.

### Expected behavior

A catalogue of ~11 products should return a compact JSON body (typically tens of KB with image **URLs**, or a few hundred KB with small thumbnails). Mobile clients should complete the GET well under a few seconds on typical 4G.

### Actual behavior

- HTTP **200**
- Body size **51,112,466 bytes (~51.11 MB)**
- Download often **8–54+ seconds** depending on client
- Images embedded as Base64 in `Image1`–`Image4`, `CategoryImage`, `SubcategoryImage`

### Evidence

See `API_PERFORMANCE_DIAGNOSIS.md` (Node + PowerShell timings, per-field sizes).  
Example: ProductId **14** alone contributes ~12.7 MB across four product image fields; several `CategoryImage` values are ~4 MB each even when product images are null.

### Recommended backend fix

1. **Stop embedding full-resolution Base64 in the products list.**  
2. Return **HTTPS image URLs** (CDN or blob storage) for:
   - product primary / gallery
   - category / subcategory icons  
3. Serve **compressed** images (WebP/JPEG), with separate **thumbnail** and **detail** sizes.  
4. Prefer **one primary image URL** on the list endpoint; load gallery images on a product-detail endpoint if needed.  
5. Add **pagination** (`page` / `pageSize` or cursor) before catalogue growth.

---

## 2. Missing product images for most SKUs (HIGH)

### Exact endpoint

Same as above.

### Reproduction steps

1. Fetch products for company `8787888888`.  
2. Inspect `Image1`–`Image4` per row.

### Expected behavior

Published sellable products should expose at least one valid product image (URL or small thumbnail).

### Actual behavior

At measurement time:

- **3 / 11** products had Base64 product images  
- **8 / 11** had `Image1`–`Image4` all `null`  
- Several of those still returned multi-MB `CategoryImage` values

### Evidence

| ProductId | ProductName | Product images |
|-----------|-------------|----------------|
| 5 | DAIRY SILK | all null |
| 7 | SUPER BASMATI RICE | all null |
| 8 | ORGANIC MOONG DAL | all null |
| 9 | ORGANIC PEANUT | all null |
| 10 | MATIC LIQUID TOP LOAD | all null |
| 11 | POWER PLUS 10X TOTAL CLEAN | all null |
| 12 | TAMARIND SHINE SPECIALIST | all null |
| 13 | test | all null |

### Recommended backend fix

1. Verify ERP → API image publication for each SKU.  
2. Ensure list API only includes sellable / fully published products, or flags incomplete media.  
3. Do not attach huge category artwork as a substitute for missing product photos on the list payload.

---

## 3. No cheap revalidation / image versioning (HIGH)

### Exact endpoint

Same products list.

### Reproduction steps

1. Inspect response headers.  
2. Note absence of validators and presence of inline Base64 (URL never changes because there is no URL).

### Expected behavior

Clients can revalidate with `ETag` / `If-None-Match` or receive versioned image URLs (`?v=` / path version / `updatedAt`) when ERP replaces an image.

### Actual behavior

- `Cache-Control: no-cache`  
- No `ETag`  
- No `updatedAt` / image version fields observed on product rows  
- Image bytes live inside JSON — any image change forces full ~51 MB re-download

### Evidence

Node fetch header dump in diagnosis report.

### Recommended backend fix

1. Add **ETag** (or strong hash of catalogue revision) and honor conditional GET → **304**.  
2. Expose `imageUpdatedAt` or versioned CDN URLs when ERP replaces bytes at the same logical asset.  
3. Keep list payload tiny so pull-to-refresh is cheap.

---

## Evaluations (not claimed as current defects)

These would help once the payload is fixed; they were **not** separately proven as outages in this pass:

- Database indexing on company / publish flags  
- Dedicated `GET /products/{id}` for gallery  
- WebP pipeline and max dimension limits server-side  
- Branch / storefront visibility rules documentation for ERP publish  
- Consistent null vs `System.Byte[]` handling (client already rejects `System.Byte[]`; not observed in this sample)

---

## Mobile app mitigations already applied

Documented for backend awareness — **not a substitute** for payload reduction:

- Products GET timeout raised to **90s**  
- Abort + latest-request-wins refresh  
- In-flight request dedupe + bounded retries  
- Drop oversized inline category/subcategory Base64 from app state (&gt;250 000 chars) with local presentation fallbacks  
- Stronger image `cacheKey` fingerprint for Base64 content changes  
- Soft error banner when refresh fails but cached products remain  
- Pull-to-refresh on Shop / collections
