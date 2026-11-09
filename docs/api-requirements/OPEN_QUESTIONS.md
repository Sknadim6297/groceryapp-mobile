# Open Questions — Backend Handoff

Items that **cannot be confidently determined** from the frontend alone.  
Separate **Confirmed** (code/docs prove it) from **Assumptions** and **Proposed**.

---

## Confirmed from frontend / existing docs

1. Live base URL defaults to `https://api.supertrading.online` (`EXPO_PUBLIC_API_BASE_URL`).
2. Customer auth endpoints already called:
   - `POST /api/values/customer/send-otp`
   - `POST /api/values/customer/resend-otp`
   - `POST /api/values/customer/verify-otp`
   - `POST /api/values/customer/register`
3. Request bodies use PascalCase fields (`Mobile`, `OTP`, `Name`, …) matching ASP.NET help pages.
4. Help page documents `GET /api/values/products?company={company}` but the app never calls it (`LIVE_CATALOGUE_CONNECTED = false`).
5. Success is **not** HTTP 200 alone — parser requires `Status`/`status` === `"Success"` (string) for several flows.
6. After verify success for registered customers, the app stores a **temporary UI login** (`TemporaryUiLogin`) and does **not** send Authorization on later requests.
7. Commerce (cart, checkout, orders, coupons, stores, notifications list, wallet, returns) is gated by `EXPO_PUBLIC_UI_PREVIEW` and uses fixtures / local stores when on.
8. Checkout payment methods in UI: COD, UPI, Card. Only COD can place a **demo** order. No gateway SDK is integrated.
9. Currency displayed is INR (`₹`). Mobile numbers are India 10-digit national format.
10. Account deletion is **not** offered in Settings UI.
11. Forgot-password / email-password login is **not** present — OTP mobile only.
12. Reorder button/flow is **not** implemented (marketing copy only on intro).
13. Logout today clears local session only — no revoke API call.

---

## Assumptions (need confirmation)

| # | Assumption | Why it matters |
|---|---|---|
| A1 | New commerce APIs can use `/api/v1/...` alongside existing `/api/values/...` | Path naming in this pack is proposed |
| A2 | `company` / tenant id for products comes from customer session or a fixed store config | Products GET requires `company` |
| A3 | Backend will issue `AccessToken` (or equivalent) on verify/register Success | Required before cart/orders can be authenticated |
| A4 | OTP-first unregistered Success will include `IsRegistered: false` (or equivalent) + `MobileVerificationToken` | App already prepared to consume this |
| A5 | Server recalculates all prices, fees, taxes, discounts | Frontend bill math must never be authoritative |
| A6 | One active delivery location / default address per customer | Matches address book `isDefault` |
| A7 | Order statuses match frontend enum: `placed`, `confirmed`, `packing`, `picked_up`, `out_for_delivery`, `delivered`, `cancelled` | Timeline UI depends on these |
| A8 | Cancel reasons / return reasons can reuse frontend static ids | Or backend publishes its own catalog |
| A9 | Image assets will be HTTPS URLs (not RN `require` modules) | Catalogue/API response shape |
| A10 | Tax may be included in selling price today (UI has no separate tax line) | Quote response fields |

---

## Proposed (UI exists or partially exists — product/backend decision required)

| # | Topic | Question |
|---|---|---|
| P1 | Payment gateway | Which provider for UPI/Card? Razorpay, PayU, Cashfree, other? Frontend has no SDK yet. |
| P2 | Multi-store inventory | Are `DEMO_STORES` real fulfillment nodes or marketing-only? |
| P3 | Delivery SLA | Home “10 mins” is demo-only. What ETA model is real (minutes, slots, same-day)? |
| P4 | Delivery fee rules | Demo uses flat ₹29. Free delivery above ₹499 is banner copy only. Confirm fee/tax rules. |
| P5 | Delivery slots | No slot picker UI today. Needed or not? |
| P6 | Wallet | Balance/top-up UI is stubbed/disabled. Is wallet in scope for v1? |
| P7 | Referral rewards | Invite screen is demo-only. Cashback rules? |
| P8 | Support chat | Human agents, bot, or email-only? Real-time WebSocket? |
| P9 | Push notifications | Which provider (FCM/APNs via Expo)? Payload schema? |
| P10 | Brand filter | Home brand carousel navigates with `?brand=` but Shop ignores it. Implement brand filter? |
| P11 | Recently viewed | Home rail is static fixtures, not event-based. Persist view events? |
| P12 | Buy again | Should derive from delivered order lines — confirm retention window |
| P13 | Product variants | UI has `unit` string only — no size/color variant picker. Confirm SKU model |
| P14 | GST fields | Register help page lists GST fields; app does **not** collect them. Keep optional server-side? |
| P15 | CompanyMobile / WhatsApp / Anniversary | Help page fields; app omits them. Confirm not required |
| P16 | Account deletion | Settings says not offered. Legal requirement later? |
| P17 | Media upload limits | Return photos max 4 local; chat 5MB; reviews local URIs. Confirm CDN limits |
| P18 | Idempotency keys | Frontend should send `Idempotency-Key` on place-order / payment — confirm header name |
| P19 | Pagination | Lists today are small fixtures. Confirm page size defaults for products/orders/notifications |
| P20 | CORS | Live host lacks CORS; web uses Metro proxy in `__DEV__`. Production web strategy? |
| P21 | Path versioning | Keep `/api/values` forever or migrate customer APIs to `/api/v1`? |
| P22 | Order ownership | Confirm customers can only read/cancel their own orders (server must enforce) |
| P23 | Stock reservation | When is stock reserved — add-to-cart vs place-order? |
| P24 | Coupon stacking | UI applies one coupon id. Confirm single-coupon rule |
| P25 | Leave at door + instructions | Captured in UI; confirm order payload fields |
| P26 | Privacy/Terms CMS | Keep static screens or serve from API? |
| P27 | Map provider | Delivery location uses MapLibre + OpenFreeMap; tracking map is SVG demo. Live tracking map provider? |
| P28 | SMS OTP hash (Android) | App has Android SMS OTP autofill helpers — confirm SMS template format with hash |

---

## Blockers before live commerce

These must be answered / shipped before turning off UI preview for checkout:

1. Published product JSON sample + real `company` value.
2. Real Authorization session (`AccessToken` + header contract + expiry/refresh).
3. Server cart quote + stock validation.
4. Place order + COD flow; online payment initiate/confirm if UPI/Card are offered.
5. Order list/detail/active + tracking payload.
6. OTP-first send-otp for unregistered mobiles (desired UX documented in `docs/backend-requirements.md`).

---

## How to use this list

- Backend developer: answer each Assumptions/Proposed item in writing before estimating.
- Frontend integrator: do not invent missing fields; keep fixtures until contracts are published.
- Product owner: decide P2 scope (wallet, stores, referral, chat) for MVP cut.
