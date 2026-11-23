# PolyOps factory operations requirements

A plastics supplier needs to know how many units of each material grade it can promise a business buyer. Factory admins take orders and agree prices from the catalog. Floor staff receive deliveries, pack orders and record dispatch. Both roles use the Expo app and share one inventory ledger.

## Material and order lifecycle

- Each material grade has a factory-specific SKU, price in integer paise per whole unit, available quantity, alert threshold and active flag. Only admins edit the catalog. Receiving stock creates a movement showing the new balance.
- An admin records a buyer company, contact number, order source and 1–50 lines. The API merges duplicate lines, uses current catalog prices and reserves the quantities in one transaction. If any grade is short, the order and all its reservations fail together.
- Staff can advance pending orders to packed and packed orders to shipped. Admins can also mark a shipped order delivered or cancel a pending or packed order. Cancellation releases each reservation once. Receipts and new orders support content-bound retry keys.
- Staff see quantities, grades and dispatch progress. The API withholds prices and phone numbers from staff. All business data belongs to the factory identified by the authenticated membership.
- Admins can review order value, units, top grades, low available stock and open dispatch work. Reports use India calendar days. The optional weekly brief uses aggregate figures.

## Boundaries and acceptance

Stock is counted in whole units. A receipt note may include a supplier or lot reference. Structured lots, weighed stock, production scheduling and yield calculations would require additional data models.

Use isolated PGlite API tests for stock rollback, concurrent reservations, cancellation, retries, role restrictions, factory isolation and report totals. The demo walkthrough covers receipt through dispatch on a phone. A physical-device walkthrough and deployment checks remain release activities.
