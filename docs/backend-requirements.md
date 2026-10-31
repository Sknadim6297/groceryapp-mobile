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

The app sends only mobile, name, email, address, and date of birth when the customer entered them. It does not invent company mobile, WhatsApp, anniversary, or GST.

## Required from the C# API before authentication can finish

For each auth endpoint, publish:

1. The JSON for success and for failure, including failures returned with HTTP 200.
2. Whether verify-otp means an existing customer, a new customer, or only that the code matched.
3. The session credential field name, expiry, and how a later request proves the customer. If none is issued, say so.
4. Which registration fields are required, and whether registration happens before or after OTP.
5. The exact `Mobile` format (10 digits or `+91`).
6. OTP expiry, resend limits, and the message for an incorrect, expired, or reused code.

The running API has returned the text "Customer is not registered". That sentence opens Complete Profile and does not create an account. A matching "already registered" or "Invalid OTP" / "OTP expired" sentence stays on the current screen and is shown as an error.

Until a success and session contract exists, the app does not open Home. HTTP 200 alone is not treated as a signed-in customer. No token is stored. A registered customer's OTP can be requested, but the app cannot tell a dispatched code from an undocumented 200, so it does not open the OTP screen or Home for that case yet.

## Required before catalogue, cart, and orders

1. The real `company` value for `GET /api/values/products`, plus the product JSON (id, name, price, image, stock).
2. Cart, coupon, address book, checkout, payment, order create, order list, and tracking endpoints. None of these are on the help page.
3. Server-calculated payable totals. The app must not be the source of price, discount, fee, or stock.

## Not a client substitute

Rate limits, customer data isolation, and payment authorization have to be enforced on the server. The app only avoids logging bodies and refuses a non-HTTPS base URL.
