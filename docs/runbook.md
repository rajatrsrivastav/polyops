# Packbay operating runbook

This is an operator procedure, not evidence of a deployment. Codex did not create cloud resources, configure accounts, rotate keys, sign an APK or contact sellers. The companion project plan was absent; Render is the concrete API target selected for this draft. Review current provider documentation and pricing before choosing plans.

## Before first deployment

1. Review the PRD, API contract, data model and eight ADRs. Run each package’s checks and inspect the diff. The author of this baseline is Codex; human review and learning notes are still required.
2. Review dependency advisories in implementation-status.md. The SDK 55 tooling audit needs a deliberate compatibility upgrade before a real pilot. Do not run audit --force blindly; it proposes incompatible SDK or Firebase versions.
3. Create a Firebase project, enable email/password Auth and register web/native client configuration. Keep the service account private. Supply only variable names to assistance tools.
4. Set a privacy contact, retention period and backup expiry policy in privacy.md. Rebuild the web page after changes. Obtain the pilot seller’s written agreement.
5. Decide backup ownership, schedule and encrypted off-repo storage. Run a restore drill before accepting customer data.

## Atlas

Create a project and replica-set-capable cluster in your chosen region. Create a database user restricted to the Packbay database, not an organization administrator. Restrict network access to the API provider’s actual egress addresses or another reviewed private access setup; avoid permanent access from all addresses. Store the connection URI in the API host’s secret settings, never in source or a public Expo/Vite variable.

Check current tier support for backups, storage, connections, regional availability and retention on [Atlas pricing](https://www.mongodb.com/pricing) and [backup documentation](https://www.mongodb.com/docs/atlas/backup-restore-cluster/). Do not assume a free tier includes managed backups.

Production autoIndex is off. Before first traffic, use a trusted operator machine with database access and the API’s dependencies installed. Supply MONGO_URI privately and run from server/:

```sh
CONFIRM_INDEX_MIGRATION=packbay npx tsx scripts/migrations/001CreateIndexes.ts
```

The migration creates schema indexes without dropping existing ones. Stop and resolve duplicate data if an index fails. Future migrations require a backup and a dated decision-log entry.

## Render API

Connect the reviewed repository as a Docker web service. Set the Docker context to server/ and Dockerfile to server/Dockerfile according to the host’s root/context controls. Do not pass secrets as build arguments. The container command is `node dist/index.js`; it binds all interfaces and respects PORT. The multi-stage node:22-slim image installs production dependencies only, copies compiled output and runs as user node. Debian slim avoids Alpine/musl-specific compatibility work; the production image built successfully, but final size/runtime smoke evidence is unavailable after Docker’s daemon disconnected.

Set runtime names: MONGO_URI, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, CORS_ORIGINS, NODE_ENV=production, PORT (or host supplied), LOG_LEVEL, TRUST_PROXY_HOPS. Optional: GEMINI_API_KEY, GEMINI_MODEL, SENTRY_DSN, RELEASE_SHA. Values belong in host settings. Private-key line breaks may be actual newlines or escaped newline sequences. RELEASE_SHA should be the deployed Git SHA. Startup reports missing variable names, not their values.

Configure `/ready` as the host’s HTTP health path because serving orders requires Mongo. `/health` is process liveness and does not use the database. Both probe routes are exempt from the business IP quota so provider checks do not exhaust it. The Docker HEALTHCHECK uses /health. Configure an external uptime monitor for /health and optionally /ready as a separate dependency check. Follow [Render health checks](https://render.com/docs/health-checks); check current limits and behavior rather than assuming them.

TRUST_PROXY_HOPS defaults to zero locally. Set it only after verifying the provider’s proxy chain (commonly one hop, but verify), forwarded-header behavior and whether the application is reachable through a shorter alternate path. Never set trust proxy to unrestricted true. Confirm two real client IPs get separate quotas without logging identity or token data.

Check [Render pricing](https://render.com/pricing) for current sleep/cold-start behavior, CPU/RAM, egress, logs, backups, custom domains and paid obligations. No plan limits are asserted here.

## Vercel web

Create an application with root web/, install `npm ci`, build `npm run build`, output dist/. The committed rewrite configuration supports deep links. Set VITE_API_URL to the exact HTTPS API origin without /api. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID. These identify the client Firebase app and are compiled into the bundle; never place service-account credentials, Mongo URIs or Gemini keys in VITE variables. Optional VITE_SENTRY_DSN and VITE_RELEASE_SHA enable sanitized web failure reporting.

After the actual web URL exists, put that exact origin in API CORS_ORIGINS, redeploy the API and test preflight plus a protected call. Add the deployed web domain in Firebase Auth’s authorized domains. Review preview-domain policy rather than allowing wildcard origins. Check [Vercel pricing](https://vercel.com/pricing) for current usage and project terms.

## EAS preview APK

In mobile/, configure EXPO_PUBLIC_API_URL with the deployed HTTPS API origin and the four EXPO_PUBLIC_FIREBASE_* names. Native values are compiled into the bundle, so changes require rebuilding. Confirm the app identifiers in app.json belong to you, then initialize/link the EAS project in your own account. The committed preview profile requests internal distribution and APK output:

```sh
npx eas-cli@latest build --platform android --profile preview
```

Manage signing credentials in EAS; do not commit keystores. Install the resulting build on the staff device and verify actual sign-in persistence after terminating/reopening it. The local Android export is not a signed APK. Check current [EAS APK guidance](https://docs.expo.dev/build-reference/apk/) and [Expo pricing](https://expo.dev/pricing) for build quotas, queue times and distribution terms.

## Provision a pilot

After consent and backups, run the administrative script from a trusted machine with the API environment privately configured:

```sh
npm --prefix server run admin:create-shop -- --name="Example Shop" --slug=example-shop --ownerEmail=owner@example.test --staffEmail=packer@example.test
```

Replace the synthetic addresses in your own terminal. The script creates Firebase identities without choosing passwords and creates the shop/users transactionally in Mongo. If provisioning fails, it attempts to remove identities created by that run; review the console if cleanup fails. Send password reset emails from Firebase Console so each person chooses their own password. Do not paste reset links into Git or logs. Existing Firebase accounts are not silently reassigned to another shop.

Demo seeding uses existing Firebase UIDs and is separate from provisioning. It wipes only the marked millet-co demo shop. Stop demo traffic before seeding. Never seed or load test a pilot shop.

## Post-deploy smoke test

```sh
curl --fail "$API_URL/health"
curl --fail "$API_URL/ready"
```

Both should return JSON with ok=true. Sign in as demo owner on web; add a product and receive stock; create a two-item order. Refresh the staff phone’s list; mark packed then shipped. Verify owner status and inventory movement balances. Cancel a second pending order and verify the returned stock. Check analytics, weekly template/provider labeling, second-call cache, rejected cross-origin requests, 401/403 responses and absence of private fields in staff payloads. Restart the phone app to verify persistent sign-in. Do not mark pilot-ready until these succeed with the actual providers.

## Logs, Sentry and monitoring

Pino emits request ID, method, matched route, status, latency, and authenticated user/shop IDs. Request serializers omit paths/query strings, headers, cookies and bodies. Exception text is also excluded because upstream messages can contain personal data or connection strings. Example (synthetic, not measured traffic):

```json
{"level":30,"req":{"id":"synthetic-request","method":"POST"},"res":{"statusCode":201},"route":"/orders","userId":"synthetic-user","shopId":"synthetic-shop","responseTime":12,"msg":"request completed"}
```

Sentry is opt-in; default integrations and tracing are disabled (sample rate zero). Server reports unexpected 500 errors only from errorHandler; expected client errors and raw exception messages are excluded. Events contain a generic failure label, safe error type, request ID and release. Web ErrorBoundary reports a generic rendering-failure event. This prioritizes privacy over detailed stack capture. Any expansion of captured data requires a privacy review. Correlate request IDs with safe application logs. Do not enable replay, analytics or PII collection casually.

Set an uptime monitor such as UptimeRobot or Better Stack to /health and route notifications to the operator. Check current free-plan intervals, limits and alert delivery. No monitor was created by this build.

## API is down: what to check in order

1. Distinguish /health failure from /ready failure. Look at provider availability and current deployment status.
2. Inspect safe startup logs for missing variable names, port binding, invalid Firebase setup or database access failure.
3. Check Atlas cluster/network access, database user, connection count and recent secret rotation without printing the URI.
4. Verify exact CORS origin and Firebase authorized domain for browser-only failures. A native connection failure often means an unreachable API address or old embedded build settings.
5. Confirm the configured proxy chain and 429 rate-limit behavior. Avoid weakening auth or exposing secrets to debug.
6. Compare the deployed release to the last known working version. Roll back if appropriate, then reproduce with synthetic data and add a regression test.

## Backup and restore drill

Check whether the selected Atlas tier supplies managed backups. If not, use MongoDB Database Tools from a trusted machine. Keep configuration and credentials in a private off-repo tools config supported by your installed version. Run mongodump for the Packbay database into an encrypted destination outside this repo; do not put a URI with credentials in shell history or command arguments. Schedule at least a weekly operator backup and choose a recovery window acceptable to the pilot; more frequent business changes may require a shorter interval. Record timestamp, database, size, encryption/access owner and retention without recording credentials.

Before first pilot, restore a backup into an isolated local replica-set database with mongorestore. Never use a pilot destination for a drill. Compare collection counts, sample order totals, indexes and ledger reconciliation; run the app against the restored copy. Record actual commands with secrets removed and actual results in metrics.md. Encrypt archives, restrict access and expire backups according to privacy.md. No backup or restore drill has actually been executed here.

## Rollback

API: redeploy the last reviewed container/release through the host, then check /health, /ready and the smoke flow. Web: restore the last working Vercel deployment and confirm its API compatibility. Mobile: distribute the previous internal APK after checking API compatibility; do not promise OTA rollback without configured update infrastructure. Database: restore into a new isolated cluster/database, verify data and indexes, then deliberately switch API configuration. Do not destructively restore over the live database as a first response.

## Rotate secrets

Firebase service account: create the replacement in the operator console, update API host secret settings, redeploy and smoke-test token verification, then revoke the old credential. Mongo: create/rotate a restricted DB user, update API settings, deploy and verify readiness before removing the old account. Gemini: replace the API key in host settings and verify a synthetic brief before revoking the old key. Sentry: rotate the DSN/project credentials as appropriate and rebuild the web client if its embedded configuration changes. A leaked Firebase client configuration alone is not a service-account secret; review authorized domains and project restrictions. If an actual secret was committed, revoke it first and have the repository owner arrange history cleanup; rewriting history alone does not revoke it.

## Data removal

Verify the seller’s request, determine retention obligations and backup expiry, take any legally appropriate final restricted archive and stop traffic for the target shop. The removal script is intentionally destructive and requires matching arguments:

```sh
npm --prefix server run admin:delete-shop -- --shop=example-shop --confirm=example-shop
```

It disables Firebase identities, deletes shop business records transactionally, removes remote identities and finally removes Mongo user/shop records. If a remote step fails, it retains enough local identity records to retry. Review partial failure before rerunning. Verify no shop documents remain and apply backup expiry; do not claim instant deletion from retained backups. Record completion without customer details.

## CI and local reproduction

CI runs package lint/types/tests, web/server builds, Android export, Docker build and Gitleaks. Permissions are contents:read and older same-branch runs are canceled. Checkout/setup-node v7 and Gitleaks action v3 were checked on their official release pages on 19 November 2026: [checkout](https://github.com/actions/checkout/releases), [setup-node](https://github.com/actions/setup-node/releases), [gitleaks](https://github.com/gitleaks/gitleaks-action/releases). They may change; inspect the actual Actions run before assuming a failure is app code. Tests need no cloud secrets, but CI needs network access to install dependencies and download the Mongo binary.

Open the failed job, identify the first failing command and reproduce it from that package locally with npm ci and the same command. Runtime test requests never use Atlas. Gitleaks may require a license when used under an organization; review its current terms before switching ownership. No hosted CI run has been executed in this session.

## Load testing honestly

scripts/load/orders.js ramps to 20 VUs over a total two-minute run, exercises product/order reads and synthetic creates, and asserts p95 under 500ms plus error rate below 1%. It verifies the token’s server-reported isDemo and shop slug as well as an explicit demo ID. Supply ample synthetic stock and never use pilot credentials. Credentials belong only in the local process environment, not a saved result file.

The production IP quota is intentionally 100/15min. A 20-VU run from one egress IP will hit 429s under that quota; the script does not hide them. Such a failure demonstrates the deployed guard, not backend capacity. To benchmark beyond it, use a separately reviewed demo/staging configuration with a suitable quota and record that difference explicitly; never disable the production quota for real users. Free-host cold starts and shared resources also affect latency. No load run, pass, p95 or capacity number is claimed.

## Manual accessibility and launch gate

- Login: labels and visible focus implemented; actual credential sign-in and keyboard error focus require configured Firebase.
- Dashboard/products/orders: semantic buttons, table headers, text statuses, modal focus behavior, skip link and responsive layout implemented; authenticated keyboard-only/zoom/contrast review remains required.
- Staff pick list/details/receipts: minimum 50px buttons, screen-reader labels and text status implemented; TalkBack and small-device testing remain required.
- Privacy/contact/retention completed; backup restore drill recorded; actual provider smoke flow passes; dependency advisories reviewed; real usage claims backed by evidence.
