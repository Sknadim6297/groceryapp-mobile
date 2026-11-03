# GroceryApp backend requirements

The published help page is https://api.supertrading.online/Help. This app does not invent success bodies, tokens, company ids, prices, or payments.

## Confirmed request contracts

| Method | Path | Request | Response sample |
| --- | --- | --- | --- |
| POST | `/api/values/customer/send-otp` | `{ "Mobile": string }` | Not published. Described as Collection of Object. |
| POST | `/api/values/customer/resend-otp` | `{ "Mobile": string }` | Not published. |
| POST | `/api/values/customer/verify-otp` | `{ "Mobile": string, "OTP": string }` | Not published. |
| POST | `/api/values/customer/register` | `Mobile`, `Name`, `Address`, `CompanyMobile`, `WhatsApp`, `DOB`, `Anniversary`, `Email`, `Country`, `State`, `City`, `Pincode`, `GSTType`, `GSTIN` | Not published. |
| GET | `/api/values/products?company={company}` | `company` is a required string | Not published. |

The app sends only mobile, name, email, address, and date of birth when the customer entered them. It does not invent company mobile, WhatsApp, anniversary, or GST. When OTP-first verify-otp returns a verification token, the app also sends `MobileVerificationToken` on register.

## Live probe (2026-11-03)

`POST /api/values/customer/send-otp` with an unused mobile returned:

```json
[{ "Status": "Failed", "Message": "Customer is not registered with this mobile number." }]
```

No OTP is sent for unregistered mobiles today. The desired Swiggy/Blinkit OTP-first flow is **not** supported until the C# changes below are deployed.

## Desired customer UX (OTP-first)

### Registered customer

Mobile → send-otp → verify-otp Success → Home.

### New customer

Mobile → send-otp → verify-otp Success (unregistered) → Personal Information → Location → register once → Home.

OTP must be verified **once**. Registration must not require a second OTP when verify-otp already established a server-side verified mobile identity.

## Temporary device login (current)

This is local UI state, not a backend session. After `verify-otp` returns `Status: "Success"` for a **registered** customer, the app saves the verified Mobile plus CustomerId and Name when the body includes them, then opens Home. The record is marked `temporary-ui` and is stored with Expo SecureStore.

Restart restores that record and keeps the UI signed in. Logout deletes it. No token or cookie is invented for Authorization headers until the API publishes a real session contract.

## Exact C# changes required for OTP-first authentication

### 1. send-otp for unregistered mobiles

- Accept the mobile and **send** an OTP (same as registered).
- Return HTTP 200, `Status: "Success"`, and a message that the OTP was sent (must match OTP-sent wording).
- Do **not** return `Customer is not registered` on send-otp when a code was actually sent.

### 2. send-otp for registered mobiles

- Keep current behaviour: `Status: "Success"` and an OTP-sent message.

### 3. verify-otp for registered mobiles

- HTTP 200, `Status: "Success"`, message such as `OTP verified successfully`.
- Include `CustomerId`, `Name`, `Mobile` when available.
- Prefer a non-empty `AccessToken` (or another Token/Session/Jwt/Bearer field) for a real backend session.

### 4. verify-otp for unregistered mobiles

- HTTP 200, `Status: "Success"`, and a clear registration-pending signal, for example:
  - `IsRegistered: false`, or
  - `RegistrationRequired: true`, or
  - `CustomerStanding: "unregistered"`, or
  - Message containing `complete registration` / `registration required` / `mobile verified`.
- Include a non-empty `MobileVerificationToken` (or AccessToken / other Token field) proving the mobile was verified. The app stores this for the register call and does not invent it.
- Do **not** treat this response as full login/Home for a missing customer.

### 5. register after OTP-first verify

- Accept optional `MobileVerificationToken` (same value returned by verify-otp).
- Reject registration when the token is missing, expired, or does not match the mobile.
- On success: HTTP 200, `Status: "Success"`, `Customer registered successfully`, plus `CustomerId`, `Name`, `Mobile`.
- Prefer returning `AccessToken` so the client can establish an authenticated session **without** a second OTP.
- Do **not** require send-otp again for that mobile when verification already succeeded.

### 6. Duplicate mobile

- `Status: "Failed"` with a message containing `already registered`, `duplicate mobile`, or `mobile number already`.
- Do not insert another row.

### 7. Invalid / expired / reused OTP

- Keep a failure message such as `OTP expired, already used, or invalid. Please request a new OTP.`

### 8. Real Authorization session (catalogue / cart / orders)

1. verify-otp or register success must return HTTP 200, `Status: "Success"`, and a non-empty string field named `AccessToken` (or Token / Session / Jwt / Bearer).
2. Publish credential expiry and the header later requests must send.
3. Do not put the credential on a `Status: "Failed"` body.

Until item 8 is deployed, Home can open from the temporary device login after a confirmed Success + customer (or after OTP-first register Success with customer). Later customer API calls still have no Authorization header.

## Registered / unregistered detection (current)

There is no separate customer-status endpoint on the help page. The app uses **`POST /api/values/customer/send-otp`** as the documented signal:

| send-otp outcome | Meaning | App navigation |
| --- | --- | --- |
| `Status: Success` + OTP-sent message | Mobile is registered | OTP → verify → Home |
| `Status: Failed` + message containing `Customer is not registered` | Mobile is unregistered | Personal Information → Location → register → OTP (until OTP-first ships) |
| Network / timeout / other failure | Unknown | Stay on Login; never assume unregistered |

Development builds still call live send-otp first. Dev OTP is issued only for unregistered mobiles (OTP-first simulation). Registered mobiles use the live OTP path.

If register still returns `This customer mobile number is already registered.`, the app stops registration, clears onboarding draft state, shows “This number already has an account. Please log in.”, and returns to Login with the mobile preserved (no auto OTP).

## Compatible frontend behaviour until OTP-first ships

- Login treats send-otp `Customer is not registered` as unregistered (Personal Information after optional Dev OTP).
- Registered send-otp Success opens Login OTP — never Personal Information.
- After register, the app still requests OTP when the mobile was **not** already verified.
- When verify-otp returns the OTP-first unregistered Success shape, the app opens Personal Information → Location → register once → Home and **does not** send a second OTP.
- Development-test OTP is for unregistered simulation only; it must not override a live registered send-otp result.

## Required before catalogue, cart, and orders

1. The real `company` value for `GET /api/values/products`, plus the product JSON (id, name, price, image, stock).
2. Cart, coupon, address book, checkout, payment, order create, order list, and tracking endpoints. None of these are on the help page.
3. Server-calculated payable totals. The app must not be the source of price, discount, fee, or stock.

## Frontend demo mode (UI only)

`EXPO_PUBLIC_UI_PREVIEW=on` enables local demo fixtures for orders, checkout simulation, coupons, stores, transactions, notifications, and settings.

- Demo orders live in `src/data/demoOrders.ts` and the in-memory `PreviewSession` — not SecureStore customer books.
- Simulated checkout never calls payment providers or order APIs.
- Auth, OTP, registration, and location remain on the live customer endpoints above.
- Turn the flag `off` to hide demo commerce surfaces and restore empty/placeholder states.

## Product Filters & Sort (local catalogue today)

Shop listing filters/sorts against on-device product records only. No filter endpoints are invented.

| UI control | Local field used today | Backend field still required for production honesty |
| --- | --- | --- |
| Category | Shop shelf ids from `shopCatalog` | Published category/subcategory ids on each product |
| Price range | `price` (number, INR) | Authoritative selling price from `GET /api/values/products` |
| In Stock Only | `available` when explicitly `true`/`false` | Explicit stock / availability flag; missing must not mean “confirmed in stock” |
| Discounted Only | `compareAt` strictly greater than `price` | Server MRP / offer fields; do not invent discount % |
| Sort: Default | Stable local catalogue order | Optional ranking / popularity score if “Popular” is claimed |
| Sort: Price / Name | `price`, `name` | Same fields from published catalogue JSON |

Until stock is published on products, the In Stock Only control stays disabled with an on-screen note. Until ranking scores exist, the default sort is labelled **Default**, not Popular.

## Not a client substitute

Rate limits, customer data isolation, and payment authorization have to be enforced on the server. The app only avoids logging bodies and refuses a non-HTTPS base URL.
