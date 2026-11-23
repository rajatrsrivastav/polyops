# PolyOps architecture

The Expo app serves factory admins and staff. Both roles call the same Express API. Better Auth handles email/password sessions. Protected requests carry a bearer token and the API resolves the user's factory membership and role from Postgres. The React dashboard also consumes the REST API.

## Request and stock flow

Route middleware validates inputs and checks roles. Services use the authenticated shopId as the factory boundary. Prices and buyer contact numbers are omitted from staff projections.

Receiving a material adds to its available balance and records a ledger movement. Creating a buyer order snapshots catalog prices, decrements available balances and inserts the order and movements in a Postgres transaction. A conditional status change guards cancellation and the resulting stock release. Packing and dispatch advance order status.

Dashboard queries use India calendar days and exclude cancelled orders from sales. The optional Gemini integration receives aggregate data through the weekly brief service. Order acceptance, inventory and authentication operate independently of this integration.

## Operations

Use Postgres locally or on Neon, a Node 22 API container and an Expo build with a reachable API URL. See the root README and operating runbook. Offset pagination and per-factory order counters are suitable subjects for measurement before scaling.
