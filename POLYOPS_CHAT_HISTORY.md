# PolyOps | Engineering decision review

**Submission date:** 23 November 2026  
**Record type:** Retrospective synthesis. The questions below organize decisions documented during development. They are editorial questions, rather than quotations or a verbatim chat transcript.

**Authorship:** Rajat supplied the manufacturing context, chose the mobile-first direction and authorized Codex to implement the application. Codex authored the working implementation, drafted this review and recorded the checks it ran. The underlying project record is available in the [session history](docs/ai-sessions/README.md).

### What question should a factory operator be able to answer?

“How much of this material can I promise the next buyer?” A receipt increases available stock, a confirmed buyer order reserves it, and a cancelled order releases the reservation. PolyOps brings all three actions into the same Expo app. As a concrete demonstration, receive 10 units of a granule grade and place an order for 3. The stock desk should show 7 available, and the movement ledger should explain the difference. This is a demonstration scenario using whole units. Weighed lots and flakes-to-granules production yield still need a separate data model.

### Where does the application enforce the stock balance?

On the server. A phone can lose its connection after a receipt has reached the database. Submitting that receipt twice would make the next dispatch decision wrong. PolyOps attaches a retry key to the request. The API checks the request content before returning a previous result, and rejects conflicting reuse of the key. For a new order, the API reads catalog prices and records the reservation within a database transaction. The mobile screen then shows the saved result. [Stock service](server/src/services/stock.ts) · [Order service](server/src/services/orders.ts)

### How can admins and packing staff share one app?

Give each role the actions it needs and enforce the boundary in the API. An admin can create materials, reserve a buyer order, cancel eligible orders and inspect the commercial figures. Staff can receive stock and advance packing and dispatch. The API derives the shop and role from the authenticated identity and limits what it returns, including omitting prices and buyer phone numbers from staff order responses. [Routes](server/src/routes/index.ts) · [Order transitions](server/src/services/orderStatus.ts)

### What did the team change after the first phone trials?

A successful Expo bundle still left a phone unable to sign in when it lacked a reachable API address. Testing therefore checked the API separately from Metro. A later demo seed spent several minutes writing records without showing progress. Codex added progress reporting and a smaller seed for demonstrations, with eight materials and fourteen orders. These changes addressed different failure modes and made them easier to distinguish during a live walkthrough. [Demo seed](server/scripts/seed.ts) · [Development record](docs/ai-sessions/2026-11-19-d01-packbay-build.md)

### How should AI contribute to factory operations?

Rajat used AI assistance for implementation, debugging and verification. Within the product, the weekly brief uses aggregate shop figures and exposes the source totals for review. Stock changes, dispatch transitions and authentication run independently of text generation. This keeps a slow or unavailable model from delaying a delivery. [Weekly brief service](server/src/services/ai.ts)

### What evidence supports the submission?

The recorded quick-seed verification passed 44 server tests against an isolated Postgres-compatible test database. Mobile lint, typecheck, two helper tests and both native bundle exports also passed in the recorded redesign checks. The next release check is a complete two-role walkthrough on a physical phone, including a retried receipt, a cancellation, the resulting stock balance and a session restart. Production deployment and measured factory outcomes remain to be demonstrated. [Verification record](docs/ai-sessions/2026-11-19-d01-packbay-build.md)

### When did the work enter Git?

Verified against local Git on 23 November 2026. Each entry’s author and committer timestamps match. Times are IST (UTC+05:30).

| Date | Time | Commit | Git subject |
| --- | --- | --- | --- |
| 18 Nov 2026 | 00:37:33 | `c5fc1af` | Initial commit: FactoryEase Expo app. |
| 18 Nov 2026 | 00:44:13 | `3b647ae` | Add principal-engineer AI chat history for portal submission. |
| 18 Nov 2026 | 01:29:00 | `51aadfe` | docs: add AI chat history for portal submission |
| 19 Nov 2026 | 15:42:57 | `8bd4d83` | Save the Packbay Firebase and Mongo baseline before the auth and database migration. |
| 19 Nov 2026 | 15:43:17 | `10e1e3f` | Record the local baseline commit hash in the session log. |

At the time of this review, the Neon and Better Auth migration, PolyOps factory workflows and recent Expo design changes were in the working tree. The session log records that work separately from the five commits above.

### Milestone commits on the PolyOps review branch

The branch `codex/polyops-milestones` reconstructs six stages from the source patches. Its author dates are assigned milestones. The November 18 and 19 times match the first recorded commit on each day. Noon IST is a display convention for November 20–23. Git records the actual reconstruction time separately in each committer timestamp.

| Milestone author date and time (IST) | Commit title |
| --- | --- |
| 2026-11-18 00:37:33 | Establish the FactoryEase Expo project |
| 2026-11-19 15:42:57 | Build the Packbay order and inventory baseline |
| 2026-11-20 12:00:00 | Migrate accounts and inventory to Postgres and Better Auth |
| 2026-11-21 12:00:00 | Bring material receipts and buyer dispatch into Expo |
| 2026-11-22 12:00:00 | Add the factory admin desk and buyer order workflow |
| 2026-11-23 12:00:00 | Fix iPhone bearer sign-in and verify demo account recovery |

To read both timestamps and all six hashes, run `git log --reverse --format="%h %aI %cI %s" origin/codex/polyops-milestones` after fetching the PolyOps branch. The final application source matches the working copy used for this reconstruction. Intermediate builds were not independently tested.
