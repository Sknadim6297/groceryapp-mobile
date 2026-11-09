# MayapurBazaar API requirements pack

Send this folder to the **backend developer** (existing ASP.NET host).

## Start here

1. **`FINALIZED_P0_BACKEND_CONTRACT.md`** — verified existing APIs, finalized P0 endpoints/bodies, response/error formats, auth token flow, COD MVP cut, implementation order  
2. **`openapi-p0.yaml`** — OpenAPI 3.0 for P0 (import into Swagger Editor / Scalar / Redoc)  
3. **`postman-p0.collection.json`** — Postman Collection v2.1 (Import → Collection)

## Supporting audit docs

| File | Use |
|---|---|
| `BACKEND_DEVELOPER_HANDOFF.md` | Full product/context handoff |
| `API_ENDPOINT_SUMMARY.md` | All 70 APIs master table (earlier `/api/v1` proposals) |
| `API_PARAMETERS_HANDOFF.md` | Parameter evidence: CONFIRMED / INFERRED / NOT DEFINED |
| `API_REQUIREMENTS.md` | Detailed contracts from audit |
| `API_PRIORITY_PLAN.md` | P0 / P1 / P2 sequencing |
| `SCREEN_API_MAPPING.md` | Screen → API map |
| `MOCK_DATA_AUDIT.md` | Mock datasets to replace |
| `OPEN_QUESTIONS.md` | Open product decisions |
| `../backend-requirements.md` | Original OTP-first C# change list |

## Important path note

Audit docs originally proposed `/api/v1/...` for new routes.  
**Final decision for implementation:** new P0 commerce routes use **`/api/values/...`** for compatibility with the live host. See `FINALIZED_P0_BACKEND_CONTRACT.md` §0.

## Not in this Expo repo

Backend implementation, database, and payment gateway code are **out of scope** here. Frontend keeps mock/preview until P0 APIs pass the acceptance checklist.
