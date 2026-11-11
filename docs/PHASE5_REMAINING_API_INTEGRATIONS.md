# Phase 5 — Remaining Backend API Integrations

**Status:** Frontend-ready checklist for backend wiring.  
**Date:** 2026-11-11  
**Rule:** Paths marked **proposed / suggested** are not claimed as live. Prefer finalized contracts in `docs/api-requirements/FINALIZED_P0_BACKEND_CONTRACT.md` and `docs/api-requirements/API_ENDPOINT_SUMMARY.md`.

Being online does **not** guarantee these APIs are available.

---

## Already integrated (do not reinvent)

| Feature | Screen | Endpoint (live) | Auth |
|---|---|---|---|
| Send / resend / verify OTP | `login.tsx`, `otp.tsx` | `POST /api/values/customer/send-otp`, `resend-otp`, `verify-otp` | Public |
| Register customer | complete-profile → location confirm | `POST /api/values/customer/register` | Public |
| Update customer (best-effort) | `edit-profile.tsx`, location confirm | `POST /api/values/customer/update` | Session fields |
| Products catalogue | Shop / Home | `GET /api/values/products?company=` | Optional |
| Address details / update (partial) | Saved addresses | Existing customer address helpers | Session |

---

## Remaining integrations (priority order)

### 1. Order history & detail — **P0**
- **Screens:** `src/app/orders.tsx`, `src/app/order/[id].tsx`, Profile recent orders
- **Capability (suggested):** `GET /api/values/orders`, `GET /api/values/orders/{orderId}`
- **Request:** auth session; optional `statusGroup`, `page`, `pageSize`
- **Response (suggested):** `{ id, status, placedAt, items[], totals, address, statusAt }`
- **Auth:** Required
- **UI today:** Live empty / unavailable; preview seeds only when `UI_PREVIEW_MODE`
- **Loading/error/empty:** Skeleton → soft error + Retry → honest empty (no invented IDs)

### 2. Place order / checkout quote — **P0**
- **Screens:** `checkout.tsx`, `payment.tsx`
- **Capability (suggested):** `POST /api/values/checkout/quote`, `POST /api/values/orders` + `Idempotency-Key`
- **Request (suggested):** addressId, paymentMethod, cart lines, couponCode?, leaveAtDoor?, instructions?
- **Response (suggested):** orderId, status, payableAmount, paymentRedirect?
- **Auth:** Required
- **UI today:** Preview simulation only; must not fake live success
- **Loading/error/empty:** Disable pay while quoting; surface API message; keep cart on failure

### 3. Active order + tracking — **P0**
- **Screens:** `(tabs)/track.tsx`, `OrderTrackingScreen.tsx`
- **Capability (suggested):** `GET /api/values/orders/active`, `GET /api/values/orders/{id}/tracking`
- **Response (suggested):** status timeline, courier phone?, lastUpdate — **not** fabricated live GPS unless provided
- **Auth:** Required
- **UI today:** Demo map/timeline when preview; live empty
- **Loading/error/empty:** Empty panel with Retry; never invent ETA/driver movement

### 4. Cancel / return — **P0 / P1**
- **Screens:** order detail, track
- **Capability (suggested):** `POST .../cancel`, `POST .../returns`
- **Request:** reasonIds; return also itemIds + media refs
- **Auth:** Required
- **UI today:** Preview-only local mutations with demo labels

### 5. Server cart sync — **P0**
- **Screens:** Cart, product cards, checkout
- **Capability (suggested):** `GET/PUT/DELETE /api/values/cart...`
- **Auth:** Required
- **UI today:** Owner-scoped SecureStore cart
- **Note:** Merge strategy required on login

### 6. Addresses CRUD (server source of truth) — **P0**
- **Screens:** `addresses.tsx`, `address-form.tsx`
- **Capability:** Align with finalized address contract under `/api/values/...`
- **Auth:** Required
- **UI today:** Local vault + best-effort remote merge/update

### 7. Profile get + confirmed update — **P0**
- **Screens:** `edit-profile.tsx`
- **Capability (suggested):** GET profile; confirm update response `confirmed: true`
- **Auth:** Required
- **UI today:** Local vault first; toast when server not confirmed

### 8. Payments initiate / confirm — **P0**
- **Screens:** `payment.tsx`
- **Capability (suggested):** `POST /api/values/payments/initiate`, `.../confirm`
- **Auth:** Required
- **UI today:** Simulation / COD preview paths only

### 9. Coupons — **P1**
- **Screen:** `coupons.tsx`
- **Capability (suggested):** list / collect / validate
- **Auth:** Required
- **UI today:** Live placeholder; preview local collect only

### 10. Notifications + push token — **P1**
- **Screens:** `notifications.tsx`, settings
- **Capability (suggested):** list/read + `POST .../push-token`
- **Auth:** Required
- **UI today:** Live placeholder; preview demo inbox

### 11. Wishlist sync — **P1**
- **Screen:** `wishlist.tsx`
- **Capability (suggested):** `GET/POST/DELETE /api/values/wishlist...`
- **Auth:** Required
- **UI today:** Owner-scoped local vault

### 12. Support chat / complaints ticket system — **P1–P2**
- **Screens:** `support/chat.tsx`, `complaints/*`
- **Capability (suggested):** thread + messages; complaint CRUD
- **Auth:** Required
- **UI today:** Local demo chat / local complaints — never claim agent received

### 13. Delivery serviceability — **P0**
- **Screens:** location / checkout
- **Capability (suggested):** `GET .../delivery/serviceability?postalCode=&lat=&lng=`
- **Auth:** Optional
- **UI today:** Client geocode + reference localities only

### 14. Session refresh / server logout — **P0 / P1**
- **Screens:** App-wide, settings logout
- **Capability (suggested):** refresh + revoke
- **Auth:** Required
- **UI today:** Local session clear only

---

## Integration acceptance (frontend)

For each wired endpoint:
1. Loading state visible
2. Error copy does not claim “internet = API up”
3. Empty state honest when zero results
4. Preview/demo banners remain when `UI_PREVIEW_MODE`
5. No fabricated order IDs, payments, coupons, or support replies
