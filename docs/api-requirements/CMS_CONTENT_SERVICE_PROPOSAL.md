# MayapurBazaar — Presentation CMS proposal (approval required)

## Why a separate CMS

Verified against `https://api.supertrading.online` (2026-11-09):

| Endpoint | Result |
|---|---|
| `GET /api/values/products?company=` | **200** — only live catalogue read |
| `GET /api/values/catalog/categories` | **404** |
| `GET /api/values/catalog/home` | **404** |
| `GET /api/values/fields` | **404** |
| `GET /api/values/banners` | **404** |
| Category/image upload APIs | **Not present** |

This Expo repo has **no** ERP backend source or database credentials.  
**Do not** invent ERP write endpoints or write to production ERP.

## Recommended approach

1. Keep ERP as system of record for **products, prices, stock, customers, orders**.
2. Add a small **Presentation CMS** (or ERP modules under `/api/values/catalog/...`) for Fields, Categories, Banners, and image URLs.
3. Link CMS rows to ERP via stable `erpAliases` / external keys (already in seed JSON).
4. Upload optimized images to managed storage; store **URLs** in CMS (not Base64, not RN `require` paths).

## Proposed read APIs (ASP.NET style)

```text
GET /api/values/catalog/fields
GET /api/values/catalog/fields/{fieldId}/categories
GET /api/values/catalog/categories
GET /api/values/catalog/home/banners
```

## Proposed admin APIs (authenticated)

```text
PUT  /api/values/catalog/fields/{id}
PUT  /api/values/catalog/categories/{id}
POST /api/values/catalog/assets/upload
PUT  /api/values/catalog/banners/{id}
PUT  /api/values/catalog/banners/reorder
```

## Seed package already prepared (no DB writes)

| Artifact | Path |
|---|---|
| Seed catalog | `content/seed/presentation-catalog.json` |
| Dry-run importer | `scripts/content-seed/dry-run-import.ts` |
| Asset manifest | `content/seed/asset-manifest.json` (generated) |
| Dry-run reports | `content/seed/reports/` |

Run: `npx tsx scripts/content-seed/dry-run-import.ts`

Frontend currently loads the seed as a **local CMS fixture** until remote APIs exist.
