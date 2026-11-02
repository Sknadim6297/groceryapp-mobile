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

## Temporary device login

This is local UI state, not a backend session. After `verify-otp` returns `Status: "Success"`, the app saves the verified Mobile plus CustomerId and Name when the body includes them, then opens Home. The record is marked `temporary-ui` and is stored with Expo SecureStore. A typed mobile number, a sent OTP, a failed OTP, or a registration response does not create it.

Restart restores that record and keeps the UI signed in. Logout deletes it. No token or cookie is invented, and the saved mobile number and CustomerId are not attached to later API requests. Customer catalogue, cart, and order calls stay blocked until the API issues a real session.

Registration still does not open Home. send-otp for an unknown mobile returns "Customer is not registered...", so a new customer registers, then verifies the code, and only then reaches Home.

## Exact C# changes required before backend session authentication

1. verify-otp success must return HTTP 200, `Status: "Success"`, a message such as `OTP verified successfully`, and a non-empty string field named `AccessToken` (or another name containing Token, Session, Jwt, or Bearer).
2. Include the credential expiry and the header later requests must send. The app stores the value and does not guess an Authorization header until that contract is published.
3. When a real session replaces the temporary device login, return that credential with `Status: "Success"`. Do not put the credential on a `Status: "Failed"` body. Until then the app does not send an Authorization header.
4. send-otp for an unknown mobile must keep a message containing `Customer is not registered` and must not say a code was sent.
5. send-otp for a registered mobile must return `Status: "Success"` and a message that the OTP was sent.
6. After register succeeds, send-otp for that same mobile must send a code. Registration itself is not login.
7. A duplicate mobile must return `Status: "Failed"` and a message containing `already registered`, `duplicate mobile`, or `mobile number already`, and must not insert another row.
8. Invalid, expired, or reused codes must keep a failure message such as `OTP expired, already used, or invalid. Please request a new OTP.`

Until item 1 is deployed, Home can open from the temporary device login above. Later customer API calls still have no Authorization header.

## Required before catalogue, cart, and orders

1. The real `company` value for `GET /api/values/products`, plus the product JSON (id, name, price, image, stock).
2. Cart, coupon, address book, checkout, payment, order create, order list, and tracking endpoints. None of these are on the help page.
3. Server-calculated payable totals. The app must not be the source of price, discount, fee, or stock.

## Not a client substitute

Rate limits, customer data isolation, and payment authorization have to be enforced on the server. The app only avoids logging bodies and refuses a non-HTTPS base URL.
