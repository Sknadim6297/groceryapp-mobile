# API Performance Diagnosis — MayapurBazaar catalogue

**Date:** 2026-11-10  
**Endpoint:** `GET https://api.supertrading.online/api/values/products?company=8787888888`  
**Method:** live measurements (Node `fetch` + PowerShell `Invoke-WebRequest`) + frontend code inspection.

## Summary

Catalogue slowness and flaky refresh are primarily driven by a **~51 MB JSON payload** that embeds multi-megabyte Base64 images (product + category). The mobile client previously used a **15s Axios timeout**, which is shorter than many real downloads of this payload. Image “disappearing” is partly **missing ERP image fields** (8/11 products had null `Image1`–`Image4` at measurement time) and partly client timeout / failed refresh UX.

---

## Endpoint tested

| Item | Value |
|------|--------|
| URL | `https://api.supertrading.online/api/values/products?company=8787888888` |
| Method | GET |
| Accept | `application/json` |

## Request batch (Node fetch)

| Req | HTTP status | Headers≈TTFB (ms) | Total download+parse (ms) | Size (bytes) | Product count | IDs |
|-----|-------------|-------------------|---------------------------|--------------|---------------|-----|
| 1 | 200 | 1081 | 8414 | 51,112,466 | 11 | 6,14,5,10,8,9,15,11,7,12,13 |
| 2 | 200 | 775 | 10011 | 51,112,466 | 11 | same |
| 3 | 200 | 943 | 8159 | 51,112,466 | 11 | same |

## Request batch (PowerShell Invoke-WebRequest)

| Req | HTTP status | Total (ms) | Size (bytes) | Product count |
|-----|-------------|------------|--------------|---------------|
| 1 | 200 | 53685 | 51,112,466 | 11 |
| 2 | 200 | 47833 | 51,112,466 | 11 |
| 3 | 200 | 51159 | 51,112,466 | 11 |

PowerShell path is slower (full buffering / host JSON conversion). Still confirms **stable 200 + fixed ~51 MB body**.

## Response headers (observed)

| Header | Value |
|--------|--------|
| `Content-Type` | `application/json; charset=utf-8` |
| `Cache-Control` | `no-cache` |
| `ETag` | *(absent)* |

## Payload composition (confirmed)

| Metric | Value |
|--------|--------|
| Raw JSON size | **51.11 MB** |
| Product rows | **11** |
| Products with any `Image1`–`Image4` Base64 | **3** (ids 6, 14, 15) |
| Products with all product images null | **8** |
| `System.Byte[]` literals in this sample | **0** |
| Sum of `Image1`–`Image4` string lengths | ~19.68M chars |
| Sum of oversized `CategoryImage` / `SubcategoryImage` | ~31.43M chars |
| Node JSON parse time (after download) | ~151 ms (desktop) |

### Sample image fields

| ProductId | Name | Image1 | Image2 | Image3 | Image4 | Notes |
|-----------|------|--------|--------|--------|--------|-------|
| 6 | BIRYANI SPECIAL BASMATI RICE | base64 ~160KB | ~860KB | ~72KB | ~13KB | OK |
| 14 | Cycle Pure Agarbathi 3 in 1 | ~3.0MB | ~3.3MB | ~3.4MB | ~3.0MB | Extreme inline size |
| 15 | Pampers… | ~2.9MB | ~3.0MB | null | null | Large |
| 5 | DAIRY SILK | null | null | null | null | No product photo; CategoryImage ~4.4MB |
| 10 | MATIC LIQUID TOP LOAD | null | null | null | null | CategoryImage ~4.1MB |

Image HTTP status / content-type for dedicated image URLs: **N/A** — API returns inline Base64, not `https://` image URLs. No separate image CDN request to probe.

## Frontend processing observations

| Area | Observation |
|------|-------------|
| HTTP client | Shared Axios timeout was **15 000 ms** — shorter than many 51 MB downloads on mobile / Windows hosts |
| Normalization | Maps all `Image1`–`Image4` plus `CategoryImage` / `SubcategoryImage` into React state as `data:` URIs |
| Dedup / abort | Catalogue refresh had latest-request-wins by request id, but **did not abort** the previous download |
| Retries | None for transient GET failures |
| Pull-to-refresh (Home) | Kept cached products (good); **no soft error banner** when refresh failed with cache present |
| Pull-to-refresh (Shop / collections) | **Missing** `RefreshControl` before this fix |
| Image cache | `expo-image` `memory-disk`; recycling key previously used length + last 24 chars only |
| Render | Home uses `ScrollView` + mapped sections (not a virtualized product FlatList on Home). Shop FlatList already had basic windowing |

## Confirmed root causes

### Backend (measured)

1. **51 MB product list for 11 SKUs** — Base64 product + category images embedded in JSON.  
2. **Uncompressed multi-MB images** (e.g. product 14 ≈ 12+ MB across four fields).  
3. **Most products lack product images** (8/11 null) while still shipping multi-MB category artwork.  
4. **`Cache-Control: no-cache`**, no `ETag`, no image version / CDN URL — clients cannot conditionally revalidate cheaply.  
5. Download times commonly **8–54+ seconds** depending on client/network — feels like “app is slow”.

### Frontend (code + interaction with payload)

1. **15s timeout** caused intermittent load/refresh failures against this payload.  
2. **No AbortController** → superseded refreshes kept downloading 51 MB.  
3. **No request dedupe / bounded retries** for transient failures.  
4. **Oversized CategoryImage kept in every product object** → memory + decode pressure; UI chips do not need 4 MB icons.  
5. **Soft refresh failures invisible** on Home when cached products remained.  
6. **Shop / collection screens lacked pull-to-refresh**.  
7. Image cache key not strong enough for content fingerprinting of Base64 replacements.

## Remaining unverified hypotheses

| Hypothesis | Status |
|------------|--------|
| ERP publish lag / branch visibility causing intermittent empty catalogues | Unverified — this run always returned 11 stable IDs |
| CDN / WAF throttling specific mobile ASNs | Unverified |
| Axios JSON parse OOM on low-RAM devices for 51 MB | Plausible, not reproduced in this environment |
| Intermittent `System.Byte[]` image fields in other company datasets | Handled in client; not seen in this sample |
| Same HTTPS image URL with replaced bytes (classic CDN cache) | N/A today — no image URLs returned |

## Frontend processing time (post-fix intent)

| Step | Before | After (expected) |
|------|--------|------------------|
| Client timeout | 15s | **90s** for products GET |
| Overlapping refresh | Multiple full downloads | Abort previous + latest-wins; in-flight join when not forced |
| Category inline blobs in state | Up to ~31 MB duplicated | Dropped when &gt; 250 000 chars; local presentation fallback |
| Soft refresh error | Silent with cache | Banner + retry on Home / Shop / collections |
| Shop revalidation | No PTR | Pull-to-refresh wired |

Absolute wall-clock for first paint remains dominated by **backend payload size** until images move to URLs / pagination.
