# Data model and query/index map

Mongoose schemas live in server/src/models/index.ts. Types are inferred from schemas. All models use timestamps and strict schemas. Money and quantities have safe-integer validators. Stock is nonnegative. Fields marked optional are absent rather than null in retry-index documents.

| Collection | Fields and invariants | Index and exact supporting operation |
|---|---|---|
| Shop | name≤100, unique slug, isDemo=false by default | unique slug: provisioning and seed; _id: authenticated /me |
| User | unique Firebase UID, shopId ref, role owner/staff, email≤254 | unique firebaseUid: auth lookup; shopId: administration/deletion |
| Product | shopId, sku≤40, name≤100, pricePaise integer [0,100000000], stock integer [0,100000000], stockVersion, threshold [0,1000000], active flag | unique {shopId,sku}: duplicate prevention; {shopId,isActive,createdAt desc}: active list; _id: guarded updates and multi-item $in fetch |
| Order | shopId, unique shop code; item snapshots with productId/sku/name/qty/unitPricePaise; channel; customer name/phone; subtotalPaise; status/history; optional retry key/hash | unique {shopId,code}; partial unique {shopId,idempotencyKey} where key is string; {shopId,createdAt desc}: list/analytics; {shopId,status,createdAt desc}: status and staff lists |
| InventoryMovement | shopId, productId, optional orderId, userId, type reserve/restock/receive, positive qty, nonnegative balanceAfter, note≤200, optional retry key/hash | {shopId,productId,createdAt desc}: product ledger; partial unique {shopId,idempotencyKey} for receipt retries |
| Counter | unique shopId, seq | unique shopId: atomic per-shop order sequence |
| AiBrief | shopId, Monday week, headline, bullets, risks, source aggregate JSON, provider, building/ready state, generation lease ID/expiry | unique {shopId,week}: weekly cache and concurrency lease |

## Index caveats

Mongo’s compound sparse index on shopId+optional idempotencyKey would still include all documents containing shopId. This implementation uses a partial filter instead; see ADR 0008. All rows without a key remain valid.

Case-insensitive literal substring search on name/SKU/code/customerName uses the tenant index prefix but still scans that tenant’s candidate records. Low stock compares two document fields and also filters within the tenant. These are intentionally not claimed to be fully index-covered. Pagination sorting adds _id to break timestamp ties; existing indexes support tenant/date selection, but ties may require a small sort. Explain output is collected against synthetic data in the tests and must be repeated with representative pilot data before scale claims.

## Data consistency

Product edits cannot set stock. Receive, reserve and restock live in services/stock.ts and insert ledger rows in the same transaction. Orders snapshot DB prices, not client prices. Soft archive never physically removes an item required for cancellation. A status conditional update prevents duplicate packing/cancellation. Counter updates and multi-item stock/order writes commit together.

All queries filter by shopId derived from req.user, except Shop/User lookup required to establish that identity. No API accepts a user-controlled tenant ID. Customer phone/name are not part of logs. Staff order responses and product projections exclude financial values and phone numbers.

## Production indexes and changes

Development autoIndex is enabled. Production disables it. Before first traffic, take a backup and run `CONFIRM_INDEX_MIGRATION=packbay npx tsx scripts/migrations/001CreateIndexes.ts` from server with the deployment MONGO_URI supplied privately. The script uses createIndexes and never syncIndexes, so it does not silently drop indexes. Investigate duplicate data if creation fails. Future data changes belong in numbered migration scripts with a backup, restore test and decision-log entry.
