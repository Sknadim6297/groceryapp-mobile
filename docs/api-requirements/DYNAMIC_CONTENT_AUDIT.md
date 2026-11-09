# MayapurBazaar — Dynamic Content Audit (Phase 1–4 readiness)

**Date:** 2026-11-09  
**Constraint honored:** No database writes, no ERP schema changes, no invented upload endpoints.  
**Status:** Read-only audit + safe frontend wiring complete. CMS / import awaits approval.

---

## 1. Existing frontend assets discovered

### Local home artwork (`assets/images/home/`)

| File                                        | Likely use                                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `produce.jpg`, `fresh-fruits.jpg`           | Groceries / produce Field                                                                                                                                                   |
| `grains.jpg`                                | Atta, Rice & Grains                                                                                                                                                         |
| `masala.jpg`                                | Dals / sauces / cooking                                                                                                                                                     |
| `bakery.jpg`, `bread.jpg`                   | Bakery                                                                                                                                                                      |
| `snacks.jpg`, `snacks-drinks.jpg`           | Snacks / chocolate                                                                                                                                                          |
| `tea.jpg`, `drinks.jpg`, `juices.jpg`       | Tea / drinks                                                                                                                                                                |
| `cereal.jpg`                                | Cereals                                                                                                                                                                     |
| `instant.jpg`                               | Noodles / instant                                                                                                                                                           |
| `dairy-eggs.jpg`, `dairy.jpg`, `curd.jpg`   | Dairy                                                                                                                                                                       |
| `household.jpg`, `cleaning.jpg`             | Household / cleaners                                                                                                                                                        |
| `personal.jpg`, `baby-care.jpg`, `baby.jpg` | Beauty / baby                                                                                                                                                               |
| `banner-produce.jpg`                        | Promo banner photo                                                                                                                                                          |
| Product/veg stills                          | `apples`, `carrots`, `onions`, `tomatoes`, `peppers`, `cauliflower`, `coriander`, `frozen-veg`, `cooking-oil`, `meat`, `pet`, `pet-bowl`, `product-milk`, `product-bananas` |
| `cutouts/*.png`                             | Transparent promo cutouts                                                                                                                                                   |

### Hardcoded / demo content still in repo

| Source                            | Role                                         |
| --------------------------------- | -------------------------------------------- |
| `src/data/mockCategories.ts`      | Demo category tiles                          |
| `src/data/previewImageCatalog.ts` | UI_PREVIEW remote category/product images    |
| `src/data/homePromoBanners.ts`    | Static promo banners                         |
| `src/data/subcategoryCatalog.ts`  | Demo Field → Category tree                   |
| `src/data/shoppingCollections.ts` | Fresh / Diwali / etc. shortcuts (demo strip) |

Assets were **not deleted**. Live mode prefers ERP images, then local name-mapped fallbacks in `src/utils/catalogPresentationAssets.ts`.

---

## 2. Current ERP API capabilities

| Capability                               | Status                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `GET /api/values/products?company=`      | **Live** — products include `Category`, `Subcategory`, `CategoryImage`, `SubcategoryImage` |
| Dedicated categories tree API            | **Not live** — proposed `GET /api/values/catalog/categories`                               |
| Home feed / banners API                  | **Not live** — proposed `GET /api/values/catalog/home`                                     |
| Category / banner image upload or update | **Missing** — no write/content endpoints in help or P0 contract beyond product GET         |
| Customer auth / register / OTP           | Live (existing)                                                                            |
| Cart / checkout / orders CMS             | Proposed in P0 contract; not required for this presentation phase                          |

**Live sample (company `8787888888`, audited 2026-11-09):**

- 9 products, **4 Fields** (backend Category), **7 Categories** (backend Subcategory with product counts)
- `CategoryImage` present on some Groceries products (`data:image/…`)
- `SubcategoryImage` **absent** on all current rows → local fallbacks required for Shop by Category tiles

### Live Field → Category map

| Frontend Field (backend Category) | Frontend Categories (backend Subcategory)                       |
| --------------------------------- | --------------------------------------------------------------- |
| Groceries & Food                  | Atta, Rice & Grains; Dals & Pulses                              |
| Household Essentials              | Laundry Detergents; Household & Toilet Cleaners; Home & Kitchen |
| Beauty & Personal Care            | Bath & Body                                                     |
| Chocolate                         | Chocolate                                                       |

> The richer Bakery / Snacks list in the product brief is **not** in the live product payload yet. The app shows whatever Subcategory values the ERP returns — no permanent hardcoding of that list.

---

## 3. Available database / backend access

| Access                | Finding                                                              |
| --------------------- | -------------------------------------------------------------------- |
| This Expo repo        | **No** backend code, **no** DB credentials in app runtime for writes |
| Production ERP DB     | **Do not** touch from this app; no migrate / truncate / direct SQL   |
| Help-page ERP         | Products + customer auth only for content concerns                   |
| Managed image storage | **Not available** via current APIs                                   |

---

## 4. Field and Category terminology

| Backend            | Frontend label | UI surface                                         |
| ------------------ | -------------- | -------------------------------------------------- |
| `Category`         | **Field**      | Horizontal strip under search (`HomeCategoryTabs`) |
| `Subcategory`      | **Category**   | **Shop by category** (`CategoryGrid`)              |
| `CategoryImage`    | Field image    | Strip chips (API → local fallback)                 |
| `SubcategoryImage` | Category image | Grid tiles (API → local fallback)                  |

Selecting a Field filters Shop by Category. Selecting a Category opens Shop with that shelf id.

---

## 5. Proposed database / storage structure (approval required)

Prefer **files in storage + URL in DB**, not large Base64 columns.

```text
CatalogField (existing Category master, reuse IDs)
  - Id, Name, SortOrder, IsActive, ImageUrl

CatalogCategory (existing Subcategory master)
  - Id, FieldId, Name, SortOrder, IsActive, ImageUrl

HomeBanner
  - Id, Title, Subtitle, CtaLabel, Href, ImageUrl, SortOrder, IsActive

ContentAsset (optional)
  - Id, Kind (field|category|banner), Mime, Width, Height, Url, UpdatedAt
```

Import must be **idempotent** (match by stable Id or `FieldName||CategoryName`), dry-run first, never create duplicate Category rows or touch prices/stock.

---

## 6. Images available for reuse (name mapping)

Implemented in `catalogPresentationAssets.ts` (fallback only when ERP image empty):

| Live name                                                           | Local asset        |
| ------------------------------------------------------------------- | ------------------ |
| Groceries & Food                                                    | `produce.jpg`      |
| Household Essentials                                                | `household.jpg`    |
| Beauty & Personal Care                                              | `personal.jpg`     |
| Chocolate                                                           | `snacks.jpg`       |
| Atta, Rice & Grains                                                 | `grains.jpg`       |
| Dals & Pulses                                                       | `masala.jpg`       |
| Laundry Detergents / Household & Toilet Cleaners                    | `cleaning.jpg`     |
| Home & Kitchen                                                      | `household.jpg`    |
| Bath & Body                                                         | `personal.jpg`     |
| Bakery / Tea / Drinks / Cereals / Snacks / Instant (when published) | matching home JPGs |

HTTP and `data:image` URLs from the API are preferred when present.

---

## 7. Missing backend endpoints (do not invent)

1. `GET /api/values/catalog/categories` — authoritative Field → Category tree + image URLs + order
2. `GET /api/values/catalog/home` — banners + rails
3. Authenticated admin: upload/replace Field/Category/Banner images; enable/disable; reorder
4. Optional CDN image URLs instead of repeating Base64 on every product row

Until these exist, the app derives the tree from products and uses local presentation fallbacks.

---

## 8. Safe migration / import plan (blocked on approval)

1. Export live Category / Subcategory masters (read-only).
2. Build dry-run mapping CSV: frontend asset path → backend Id / normalized name.
3. Optimize JPGs for mobile; upload to storage; receive URLs.
4. Preview report: matched / unmatched / would-update / would-skip.
5. Idempotent UPSERT of **image URL + sort only** — never prices, stock, or product rows.
6. Backup + rollback notes before any write.

**No writes executed in this phase.**

---

## 9. Changes completed without database writes

| Change                                     | Purpose                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `src/utils/catalogPresentationAssets.ts`   | Safe name → local asset map + enrich helper                    |
| `src/context/HomeCatalogBrowseContext.tsx` | Field selection filter on Home                                 |
| `HomeCategoryTabs`                         | Fields strip; tap filters; long-press opens Field page         |
| `CategoryGrid`                             | Shop by Category = Subcategories; respects Field filter        |
| `home.tsx`                                 | Provider; Shop by Category moved under Fields; enriched images |
| `category/[id].tsx`                        | Same presentation enrich for Field detail                      |
| `scripts/audit-live-catalog-tree.ts`       | Read-only live tree dump                                       |

Unaffected: cart, checkout, customer register/address, product pricing/stock.

---

## 10. Items requiring approval

1. Backend content APIs (categories, home, image upload/update).
2. Any ERP DB write or image import.
3. Separate CMS database if ERP cannot host content.
4. Admin module implementation (reuse vs minimal new).
5. Replacing local fallbacks entirely once CDN URLs are published.

---

## 11. Test results and limitations

| Check                                | Result                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `scripts/live-category-tree.test.ts` | Pass — 4 Fields, Groceries subcategories present                                       |
| `scripts/audit-live-catalog-tree.ts` | Pass — tree + image presence summary                                                   |
| `npx tsc --noEmit`                   | Pass (run with this change set)                                                        |
| Live SubcategoryImage                | **0** rows — local fallbacks used for those tiles                                      |
| Bakery… snack Categories from brief  | **Not in live ERP** yet — cannot display until products carry those Subcategory values |
| Banner CMS                           | Still `homePromoBanners.ts` until home API exists                                      |
| Image updates without APK            | Only once managed URLs are served by API                                               |

**Limitation:** With 9 live products the catalogue is sparse; presentation quality depends on ERP publishing more Subcategories and image URLs.
