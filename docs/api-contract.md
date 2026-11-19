# API contract

Base path `/api`; liveness/readiness are outside it. This is an implementation contract drafted by Codex with explicit authorization. Requests, params and query objects reject unknown keys with strict Zod schemas. Identifiers are 24 hexadecimal characters. Lists return `{items,page,limit,total}`; page starts at 1, limit defaults to 20 and may not exceed 50. Page is capped at 10000.

Protected requests use `Authorization: Bearer <Firebase ID token>`. Server role and shop are loaded from Mongo. Every listed business route is authenticated. All errors use `{error:{code,message}}`; validation adds `details:[{path,code}]` without submitted values.

| Method and path | Role | Input | Success | Principal errors |
|---|---|---|---|---|
| GET /health | Public | None | 200 `{ok:true,ts}` | 429 |
| GET /ready | Public | None | 200 `{ok:true}` after Mongo ping | 503 NOT_READY |
| GET /api/me | Both | Empty query | 200 `{id,shopId,role,shopName,shopSlug,isDemo}` | 401 UNAUTHENTICATED; 403 NOT_PROVISIONED |
| GET /api/products | Both | q ≤100 chars; lowStock=true/false; page,limit | 200 product page; staff price omitted | 400 VALIDATION_ERROR |
| POST /api/products | Owner | name 1–100; SKU 1–40 alphanumeric/hyphen/underscore; pricePaise integer 0–100000000; threshold integer 0–1000000, default 5 | 201 product, initial stock 0 | 400; 403; 409 DUPLICATE_SKU |
| PATCH /api/products/:id | Owner | Nonempty subset of name, sku, pricePaise, lowStockThreshold; stock forbidden | 200 updated product | 400; 404 NOT_FOUND; 409 DUPLICATE_SKU |
| DELETE /api/products/:id | Owner | No query | 204, isActive=false | 404 NOT_FOUND |
| GET /api/products/:id/movements | Both | page,limit | 200 movement page | 400; 404 NOT_FOUND |
| POST /api/products/:id/movements | Both | qty integer 1–99999; note ≤200; optional UUID Idempotency-Key | 201 receipt including replay | 400; 409 PRODUCT_UNAVAILABLE / IDEMPOTENCY_CONFLICT |
| POST /api/orders | Owner | customerName 1–100; customerPhone ten digits starting 6–9; channel enum; 1–50 strict `{productId,qty}` lines, qty 1–999; optional UUID Idempotency-Key | 201 pending order including replay | 400; 403; 409 INSUFFICIENT_STOCK / IDEMPOTENCY_CONFLICT |
| GET /api/orders | Both | status; from/to YYYY-MM-DD; q≤100; page,limit | 200 order page | 400 |
| GET /api/orders/:id | Both | No query | 200 role-filtered order | 404 NOT_FOUND |
| PATCH /api/orders/:id/status | Both | strict `{to}` status enum | 200 updated role-filtered order | 403 FORBIDDEN; 404 NOT_FOUND; 409 ILLEGAL_TRANSITION |
| GET /api/dashboard | Owner | range=7d/30d; default 7d | 200 report | 400; 403 |
| POST /api/ai/weekly-brief | Owner | Empty body `{}` and query | 200 brief, source, provider, cached flag | 403; 409 BRIEF_GENERATING; 429 RATE_LIMITED |

## Examples by route

Synthetic values only. Replace identifiers with those returned by your own demo shop. Examples omit bearer token values deliberately.

- `/health` → `{ "ok": true, "ts": "2026-11-19T00:00:00.000Z" }`
- `/ready` → `{ "ok": true }`
- `/api/me` → `{ "id":"...", "shopId":"...", "role":"owner", "shopName":"Millet & Co.", "shopSlug":"millet-co", "isDemo":true }`
- `GET /api/products?lowStock=true&page=1&limit=20` → `{ "items":[], "page":1, "limit":20, "total":0 }`
- `POST /api/products`: `{ "name":"Ragi Cookies", "sku":"MC-RAGI", "pricePaise":18000, "lowStockThreshold":5 }`
- `PATCH /api/products/:id`: `{ "name":"Ragi Cookies · Fresh batch" }`; unrelated fields retain their values.
- `DELETE /api/products/:id`: no body, 204.
- `GET /api/products/:id/movements?page=1` → movement page; movement fields include type, positive qty and balanceAfter.
- `POST /api/products/:id/movements`: `{ "qty":12, "note":"Synthetic delivery" }`
- `POST /api/orders`: `{ "customerName":"Demo Customer", "customerPhone":"9999999999", "channel":"instagram", "items":[{"productId":"<returned product id>","qty":2}] }`
- `GET /api/orders?status=pending&from=2026-11-19&to=2026-11-19` → pending orders for that IST day.
- `GET /api/orders/:id` → owner receives subtotal and unit prices; staff receive code, name, channel, status/history and item identity/quantity only.
- `PATCH /api/orders/:id/status`: `{ "to":"packed" }`
- `GET /api/dashboard?range=7d` → `{summary:{revenuePaise,orderCount,units,pendingCount},salesByDay:[{day,revenuePaise,orderCount}],topSkus:[{_id,name,sku,qty,revenuePaise}],lowStock:[...]}`
- `POST /api/ai/weekly-brief` with `{}` → `{headline,bullets,risks,provider,source,week,cached,...}`. A currently building brief returns 409; retry shortly.

## Semantic rules

All prices are server authoritative integer paise. A repeated product is merged before the qty cap is checked. A retry identity is bound to normalized order content; different content returns 409. Receipts bind identity to product, qty and note. Optional keys use partial unique indexes. Clients must retain keys after uncertain failures.

Owners can pack, ship, deliver or cancel when the transition table permits. Staff can only pack and ship. Cancellation is allowed from pending/packed. Both order writes and the stock ledger are in one transaction. A retry of a status change after another successful change returns 409; clients refresh the order.

Date ranges are inclusive local calendar dates expressed as a half-open UTC interval. With no filters, staff see today’s pending/packed orders. Owner lists have no implicit date limit. Top-SKU report is capped at 10 and low-stock snapshot at 20; these are bounded report sections, not paginated list endpoints. pendingCount covers all dates, unlike period sales.

Global quota: 100 requests/15 minutes/IP, excluding liveness/readiness probes. AI quota: 5/hour/user on POST. The weekly cache is per shop per IST Monday week; it is a snapshot of the rolling seven-day aggregation when first generated. Missing Gemini configuration or rejected output produces a cached template. Gemini never receives customer records. Error messages do not expose exception stacks or submitted bodies.
