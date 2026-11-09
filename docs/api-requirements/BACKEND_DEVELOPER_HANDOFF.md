# Backend Developer Handoff — MayapurBazaar Grocery App

This document is written so a backend developer can implement APIs **without reading the Expo frontend**.  
Companion files in this folder provide contracts, screen mapping, mock audit, priorities, and open questions.

**Do not choose a database, backend framework, or payment gateway in this handoff** unless the product owner confirms. The live host already exposes ASP.NET-style customer routes.

---

## 1. Application overview

**MayapurBazaar** is an India-focused grocery delivery mobile app (Expo / React Native / Expo Router).

Shoppers:

1. Sign in with mobile OTP  
2. Complete profile + delivery location (new users)  
3. Browse home / shop / collections  
4. Add items to cart  
5. Checkout with address + payment method  
6. Place order (demo COD today)  
7. Track order, cancel/return, review  
8. Manage profile, addresses, wishlist, coupons, notifications, support

Most commerce is **UI preview / local mock**. Only customer OTP + registration call the live API today.

---

## 2. Frontend technology stack

| Layer | Choice |
|---|---|
| Runtime | Expo SDK 58, React Native 0.88, React 19 |
| Routing | Expo Router (`src/app/`) |
| HTTP | Axios (`src/services/api/http.ts`) |
| Secure storage | `expo-secure-store` |
| Maps | MapLibre + OpenFreeMap (delivery picker); SVG demo for tracking |
| Location | `expo-location` |
| Camera / QR | `expo-camera`, image picker |
| Config | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_UI_PREVIEW`, `EXPO_PUBLIC_DEV_OTP` |
| Default API host | `https://api.supertrading.online` |

---

## 3. Existing implemented features (frontend)

**Live-backed (partial):**

- Mobile send / resend / verify OTP  
- Customer registration  
- Temporary device sign-in after successful verify (not Authorization)

**Local / preview-backed UI that exists:**

- Home feed, categories, shop filters/sort, PDP, collections  
- Cart, checkout, payment method UI, demo COD place-order  
- Orders list/detail, cancel, return request, tracking demo map  
- Wishlist, coupons, reviews, notifications inbox  
- Profile, addresses, location picker  
- Wallet shell, transactions demo, payment preferences  
- Help FAQ, support chat (local), complaints (local)  
- Invite/referral demo code  
- Settings notification toggles + logout (local)

---

## 4. Complete screen inventory

See `SCREEN_API_MAPPING.md` (51 routes inspected). Primary user surfaces:

Splash → Intro → Login → OTP → Complete Profile → Location → Home → Shop → Product → Cart → Checkout → Payment → Order Confirmed → Track / Orders.

Account: Profile, Addresses, Wishlist, Coupons, Notifications, Wallet, Transactions, My Payment, Invite, Returns, Complaints, Settings, Help.

---

## 5. Complete required API inventory

**70 unique APIs** — see `API_ENDPOINT_SUMMARY.md`.

Already live (customer):

| Method | Path |
|---|---|
| POST | `/api/values/customer/send-otp` |
| POST | `/api/values/customer/resend-otp` |
| POST | `/api/values/customer/verify-otp` |
| POST | `/api/values/customer/register` |

Documented but unwired:

| Method | Path |
|---|---|
| GET | `/api/values/products?company={company}` |

All other commerce endpoints are proposed under `/api/v1/...` (confirm naming with existing `/api/values` convention).

---

## 6. Detailed API contracts

See `API_REQUIREMENTS.md` for request/response fields, validation, errors, and frontend references.

**Existing response convention the app already parses:**

- Body may be an object or a one-element array  
- `Status` / `status` string `"Success"` or failure  
- `Message` / `message` for user-visible text  
- Customer fields: `CustomerId`, `Name`, `Mobile`  
- Optional credential keys matching token/session/jwt/bearer  

New APIs may use a consistent envelope, for example:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

…but must be published explicitly. Do not assume the frontend already understands a new envelope until integration work updates parsers.

---

## 7. Authentication requirements

### Desired UX (from `docs/backend-requirements.md` + app logic)

**Registered**

Mobile → send-otp Success → verify-otp Success → Home (with AccessToken)

**Unregistered (OTP-first)**

Mobile → send-otp Success (must send OTP even if not registered) → verify-otp Success with registration-pending signal + MobileVerificationToken → Personal Information → Location → register once (with token) → Home (AccessToken) — **no second OTP**

### Current gap

- send-otp for unknown mobiles returns Failed “Customer is not registered…” and does not send OTP  
- App uses TemporaryUiLogin; **no Authorization header** on subsequent calls  
- Refresh/logout revoke endpoints do not exist

### Required session rules

1. Issue non-empty AccessToken on verify (registered) and register Success  
2. Publish header format (e.g. `Authorization: Bearer <token>`) and expiry  
3. Provide refresh endpoint  
4. Never put AccessToken on Failed bodies  
5. Server must authorize all customer-owned resources by token subject (CustomerId)

---

## 8. Data model requirements (logical)

Entities implied by frontend types (not a physical schema):

- **Customer** — id, mobile, name, email, dob, avatar  
- **Address** — label, lines, city, state, pincode, country, lat/lng, default, instructions  
- **Category / Subcategory** — id, name, image, parent, order, visible  
- **Product** — id, name, unit, price, compareAt/MRP, discountLabel, available, images[], categoryIds, brand, about, ratingAverage  
- **Cart** — customerId, lines[{productId, quantity}], leaveAtDoor  
- **Coupon** — code, discount type/value, min, max, expiry, terms  
- **Order** — id, status, statusAt, items, totals, address snapshot, payment method, partner, eta  
- **ReturnRequest** — orderId, reasonIds, itemIds, photos, status pipeline  
- **Review** — product/delivery, rating, body, tags, photos, votes  
- **Notification** — type, title, body, unread, destination  
- **Complaint** — category, subject, description, orderId?, status  
- **Transaction** — method, amount INR, kind payment/refund, status, orderId  
- **Store** (optional) — name, area, distance, hours, rating  
- **Wishlist** — productId set per customer  

Currency: **INR**. Phone: **India +91 / 10-digit national** in API bodies today.

---

## 9. Entity relationships

```text
Customer 1—* Address
Customer 1—1 Cart
Cart *—* Product (via lines)
Customer 1—* Order
Order *—* OrderLine → Product
Order 0—1 ActiveTracking
Order 0—* ReturnRequest
Order 0—1 DeliveryReview
Product 1—* ProductReview
Customer 1—* WishlistItem → Product
Customer 1—* Notification
Customer 1—* Complaint
Customer 0—1 Wallet (future)
Coupon applied 0—1 per Checkout Quote / Order
```

---

## 10. Cart and checkout business rules

1. Cart quantities are per `productId` (no variant SKUs in UI beyond `unit` string).  
2. **Server must recalculate** itemTotal, MRP, savings, deliveryFee, handlingFee, discount, grandTotal.  
3. Never accept client-submitted `price`, `total`, or `discount` as authoritative.  
4. Stock check on upsert and again at place-order.  
5. Incomplete address (missing city/PIN as required by `isCompleteDeliveryLocation`) must fail quote/place.  
6. Optional fields from UI: `leaveAtDoor`, delivery `instructions`.  
7. Single coupon application in UI.  
8. Demo delivery fee ₹29 is **not** a live rule — publish real fee logic.  
9. Free-delivery “above ₹499” banner is marketing demo only.  
10. Quote response should be the source of truth shown on Cart/Checkout/Payment.

---

## 11. Order lifecycle and allowed transitions

Frontend status enum:

`placed` → `confirmed` → `packing` → `picked_up` → `out_for_delivery` → `delivered`  
Any pre-delivered status may → `cancelled` (UI: not from delivered/cancelled).

**Cancel:** body includes `reasonIds[]` from static grocery reasons (or server catalog).  

**Return:** only when `delivered` and not already requested; requires reasonIds, itemIds, ≥1 photo.

**UI timelines:**

- Orders list collapses some stages  
- Track maps `packing` → “Preparing”

Server should publish `statusAt` timestamps per status for timeline rendering.

---

## 12. Payment requirements

UI methods: **COD**, **UPI**, **Card**.

| Method | Frontend today | Backend need |
|---|---|---|
| COD | Demo place-order locally | Place order immediately; payment_status pending/COD |
| UPI | Blocked — “gateway not connected” | Initiate + confirm with real provider |
| Card | Blocked | Same |

Rules:

- Do not invent gateway choice here  
- Payment success must be verified server-side / webhook  
- Idempotent place-order and payment-confirm  
- Transactions list should reflect payments/refunds (`DemoTransaction` fields)

---

## 13. Notifications requirements

- Inbox types: product, offer, order_placed, order_confirmed, out_for_delivery, order_delivered, coupon, announcement  
- Destination deep links: productId / orderId / coupons / categoryId / none  
- Read + read-all + optional clear  
- Settings prefs: `orderAlerts`, `offerAlerts`  
- Push token registration not implemented yet — required for real push

---

## 14. Validation and error handling

Frontend expectations from customer APIs:

- Validate India mobile (10 digits) before call  
- OTP length 6  
- Distinguish network/timeout vs business Failed Status  
- Show server `Message` when safe  

Recommended standard for new APIs:

| HTTP | When |
|---|---|
| 200/201 | Success with body |
| 400 | Validation errors |
| 401 | Missing/invalid token |
| 403 | Forbidden (not owner) |
| 404 | Unknown id |
| 409 | Conflict (duplicate order idempotency, already cancelled) |
| 422 | Business rule (out of stock, unserviceable PIN, invalid coupon) |
| 429 | Rate limit (OTP especially) |
| 500 | Unexpected |

Error body example:

```json
{
  "success": false,
  "message": "Item eggs is out of stock.",
  "code": "OUT_OF_STOCK",
  "details": { "productId": "eggs" }
}
```

Empty lists should return `[]` with 200, not 404.

---

## 15. Security requirements

1. HTTPS only (client refuses non-HTTPS base URL).  
2. OTP: expiry, attempt limits, resend cooldown, no OTP in logs.  
3. Authorization on all customer resources.  
4. Order ownership checks on get/cancel/return/review.  
5. Server-side price/stock/discount validation.  
6. Idempotent order & payment operations.  
7. Secure media upload (type/size limits; no trusting client paths).  
8. Rate limit auth and place-order.  
9. Do not log tokens, OTP, full PAN, or precise card data.  
10. Privacy: address/profile access scoped to owner.  
11. QR: client blocks payment QR auto-open — server should not require QR payment flows.  
12. API versioning strategy for `/api/values` vs `/api/v1`.

---

## 16. API implementation priorities

See `API_PRIORITY_PLAN.md`.

- **P0:** 29 APIs — auth completion, profile/addresses, catalogue, cart/quote, payments/order/track  
- **P1:** 27 APIs — wishlist, coupons, returns, reviews, notifications, complaints, media  
- **P2:** 14 APIs — wallet, stores, FAQ CMS, chat, referral, brands, legal CMS  

---

## 17. Suggested implementation order

1. Complete OTP-first + AccessToken (+ refresh)  
2. Profile + addresses  
3. Products + categories + home  
4. Cart + serviceability + quote  
5. Place order (COD) + orders list/detail/active/cancel/tracking  
6. Online payments if required  
7. Secondary modules  

---

## 18. Integration dependencies

| Frontend flag / module | Depends on |
|---|---|
| Drop TemporaryUiLogin | AccessToken contract |
| `LIVE_CATALOGUE_CONNECTED` | Products JSON + company id |
| Replace MockCart | Cart APIs + auth |
| Exit checkout Placeholder / preview | Quote + place order |
| Track tab live data | Active order + tracking |
| Coupons live | Validate + quote integration |
| Returns photos | Media upload |

Existing written requirements: `docs/backend-requirements.md` (OTP-first C# changes).

---

## 19. Open questions

See `OPEN_QUESTIONS.md` — payment gateway, company id, fee/ETA rules, multi-store, wallet scope, path naming, etc.

---

## 20. API acceptance criteria

An endpoint is **accepted** when:

1. Request/response samples are published (help page or OpenAPI).  
2. Auth rules match this handoff.  
3. Validation errors are deterministic and message-safe for UI.  
4. Customer isolation is enforced with automated tests.  
5. For money paths: totals are server-calculated; payment confirmation is server-verified; place-order is idempotent.  
6. Frontend can replace the corresponding mock without inventing fields.  
7. OTP endpoints meet OTP-first registered/unregistered behaviours documented above.  
8. No secrets appear in error bodies.

### Definition of done for MVP commerce

- Registered and new customers can authenticate and receive AccessToken  
- Catalogue loads from API  
- Cart persists server-side  
- COD order places once, appears in Orders, tracks with real status  
- Cancel works with reasons before delivery  
- Client preview fixtures are no longer required for that path  

---

## What to send the backend developer

Share this folder:

```text
docs/api-requirements/
  BACKEND_DEVELOPER_HANDOFF.md   ← start here
  API_ENDPOINT_SUMMARY.md
  API_REQUIREMENTS.md
  API_PRIORITY_PLAN.md
  SCREEN_API_MAPPING.md
  MOCK_DATA_AUDIT.md
  OPEN_QUESTIONS.md
```

Also share existing: `docs/backend-requirements.md` (OTP-first ASP.NET change list).

Ask them to answer `OPEN_QUESTIONS.md` before estimating payment/wallet/stores scope.
