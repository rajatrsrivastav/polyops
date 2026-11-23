# Packbay product requirements

Status: AI-authored implementation assumptions for Rajat’s review, authorized on 19 November 2026. The companion project plan was not supplied. These are not attributed to Rajat as hand-written design decisions.

## Problem and users

Small sellers receive orders through Instagram or WhatsApp and manage stock in notebooks. The owner needs one view of the catalog, orders, stock and sales. Staff need a phone-sized pick list and safe pack/ship/receive actions. Millet & Co. is the synthetic demo brand.

## Required scope

An administrator provisions one Shop and its owner/staff identities. All business documents belong to a shop. Firebase authenticates; Mongo authorizes. Unknown valid identities get NOT_PROVISIONED. Owners use the web client; both owner and staff identities can use packing capabilities, but the mobile UI exposes no financial features.

Products have a unique shop SKU, name, integer price in paise, stock, alert threshold and active flag. Stock starts at zero and changes through movements only. Owners create, edit and archive products; both roles read active catalog/stock and receive deliveries. Staff catalog responses omit price.

Owners create orders with 1–50 lines, integer quantities, an Indian mobile number, customer name and one channel: instagram, whatsapp, website or other. The API merges duplicate products, checks DB prices, atomically reserves stock and creates the order and ledger. Pending → packed → shipped → delivered; pending or packed → cancelled. Owners can apply valid transitions; staff can pack or ship only. Cancellation restores stock exactly once. Clients send UUID retry keys for order creation and stock receipts. Reusing a key with different content returns conflict.

Order list supports status, local-date range, text search and page/limit. Staff default to today’s pending/packed orders in India time; direct access remains shop-scoped. Owner analytics show non-cancelled sales, counts, units, top products, low stock and pending/packed count. 7- and 30-day reports include zero-sale days.

Weekly briefs use only aggregate JSON, a weekly cache, a per-user limit and validated output. They are optional and never participate in auth, stock or order processing. No live customer contacts are sent to Gemini.

## Assumptions chosen where the companion plan is missing

Only owners cancel or mark delivered. Both roles receive stock. Product search is case-insensitive literal matching on name/SKU. Order search is on code/customer name. Staff do not receive customer phone numbers or any price fields. Multiple orders may omit retry keys. Retry keys are scoped per shop, including receipts across products. A partial unique index implements optional keys correctly. Initial seed stock is represented as receive movements. The seed has fixed business data and dates, with generated database identifiers.

## Non-goals

Payments, GST invoices, offline queues, self-service shop signup, real-time subscriptions, FCM and automated pilot outreach are excluded. No real usage, latency, capacity or accessibility certification is claimed.

## Acceptance criteria

The observable security, stock, state, analytics and AI requirements map to named AC tests in server/tests. Helper checks cover client money/time/retry semantics. Deployment readiness additionally requires actual Firebase integration, phone testing, a Docker image smoke test, reviewed privacy/contact/retention, backup restoration and a real owner-to-packer smoke flow. Human onboarding, learning and pilot milestones remain human work.
