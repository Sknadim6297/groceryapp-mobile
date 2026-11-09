# MayapurBazaar — Content seeding report

**Date:** 2026-11-09  
**Mode:** Dry-run only — **0 database writes**

## Backend / database access findings

| Item                                         | Finding                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ERP write APIs for Fields/Categories/Banners | **None** (404)                                                                           |
| Image upload / managed storage API           | **None**                                                                                 |
| Backend source / schema in this repo         | **None**                                                                                 |
| Safe action taken                            | Local seed + dry-run + frontend CMS fixture                                              |
| Separate CMS                                 | **Required** until ERP adds catalog content APIs — see `CMS_CONTENT_SERVICE_PROPOSAL.md` |

## Live ERP snapshot

| Metric                   | Count |
| ------------------------ | ----- |
| Products                 | 9     |
| Fields (Category)        | 4     |
| Categories (Subcategory) | 7     |

## Proposed presentation seed

| Metric                            | Count |
| --------------------------------- | ----- |
| Fields                            | 10    |
| Categories                        | 46    |
| Banners                           | 5     |
| Would link existing Fields        | 4     |
| Would insert new Fields (CMS)     | 6     |
| Would link existing Categories    | 8     |
| Would insert new Categories (CMS) | 38    |
| Local assets OK                   | 61    |
| Missing assets                    | 0     |

## Image / banner manifests

- Seed: `content/seed/presentation-catalog.json`
- Asset manifest: `content/seed/asset-manifest.json` (`remoteUrl: null` until storage approved)
- Dry-run report: `content/seed/reports/dry-run-latest.json`

Proposed remote paths are **placeholders only** — not live URLs.

## Database changes actually performed

**None.**

## API endpoints verified

| Endpoint                             | Status |
| ------------------------------------ | ------ |
| `GET /api/values/products?company=`  | 200    |
| `GET /api/values/catalog/categories` | 404    |
| `GET /api/values/catalog/home`       | 404    |
| `GET /api/values/fields`             | 404    |
| `GET /api/values/banners`            | 404    |

## Frontend changes (no ERP writes)

- Home Fields / Shop by Category load from presentation seed
- Banners use honest CMS seed (no fake discounts)
- Shop resolves `pres-cat-*` / `pres-field-*` to real products via `erpAliases`
- Empty categories show empty shelves — no invented products

## Remaining approvals / blockers

1. Approve CMS service **or** ERP catalog content APIs
2. Approve managed image storage + URL upsert
3. Approve production/staging import of seed rows
4. Optional minimal admin UI after APIs exist

## How to re-run dry-run

```bash
npx tsx scripts/content-seed/dry-run-import.ts
```
