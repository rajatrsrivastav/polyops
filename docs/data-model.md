# Factory data model

The Postgres definitions and indexes live in server/src/db/schema.ts. The HTTP contract keeps the field shopId for a factory tenant and productId for a material grade.

| Table | Purpose and constraints |
| --- | --- |
| shops, users | Unique factory slug and provisioned factory membership keyed by Better Auth user ID. Roles are owner (factory admin) and staff. |
| products | Material grade, SKU unique within the factory, price per whole unit in integer paise, available stock, version, low-stock threshold and archive flag. |
| orders | Factory order code, buyer company/contact, order source, material and price snapshots, subtotal, status history and optional retry identity. |
| inventory_movements | Factory, grade, actor, optional order, movement type, positive quantity, resulting available balance and optional receipt note. |
| counters | Per-factory sequence for buyer order numbering. |
| ai_briefs | Weekly aggregate snapshot, generated text, provider and generation lease. |

Better Auth uses its own user, account, session and verification tables. Business queries obtain the factory ID from the authenticated membership. Tenant-scoped partial unique indexes enforce order and receipt retry keys when present. Transactions keep order lines, stock decrements and movements consistent. Archived grades remain available for restoration on cancellation.
