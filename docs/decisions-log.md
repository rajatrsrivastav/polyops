# Implementation decisions

19 November 2026: Rajat authorized Codex to author all parts, including the playbook’s reserved sections. All design docs and core services in this build are AI-authored and require review; do not claim hand authorship.

19 November 2026: The companion project plan was absent. The PRD records the chosen scope assumptions, notably owner-only cancellation/delivery and staff receipt permission.

19 November 2026: Three separate npm packages follow the playbook. Express 5.3 automatically forwards async rejection to errorHandler. Node 22 is retained as specified.

19 November 2026: Optional retry keys use partial unique indexes rather than compound sparse indexes. Receipt operations also accept retry keys to prevent double stock increments.

19 November 2026: Firebase verifies revoked tokens; roles remain in Mongo. Staff payloads omit prices, subtotals and customer phones. Exact-origin CORS rejects unknown origins.

19 November 2026: Development Mongo uses a single-node replica set; test Mongo uses the actual binary. A documented Jest runtimeAdapters workaround is test-only.

19 November 2026: Expo SDK 55 selected with its versioned docs. AsyncStorage is required for native Firebase persistence; expo-crypto supplies reliable UUID retry identities. React DOM/web packages satisfy Expo Router’s peers.

19 November 2026: Weekly brief creation claims a Mongo generation lease before invoking Gemini, preventing concurrent calls from separate API instances. A crash leaves a reclaimable lease. A request after expiry may retry; SDK cancellation cannot guarantee server-side cancellation of billed work.

19 November 2026: Sentry is opt-in through configured DSNs. Automatic integrations and traces are disabled; events contain sanitized failure labels and request correlation only, with no bodies, tokens, contacts or arbitrary exception text.

19 November 2026: Checkout/setup-node v7 and gitleaks-action v3 selected from official releases. Cloud deployment, branch protection and EAS signing remain operator actions. No Git commits or history rewrite performed.

19 November 2026: Exempt liveness/readiness probes from the business IP quota so frequent provider health checks cannot cause an unhealthy restart loop. The limiter test still verifies 429 and its envelope on a business/unmatched route.
