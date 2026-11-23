# PolyOps operating runbook

## Start and provision

Use the root README for package installation, Postgres configuration and the two local processes. Configure Better Auth on the API host. The phone needs a reachable API origin in EXPO_PUBLIC_API_URL. Private credentials belong on the server.

Use the guarded synthetic seed for demos. For a new factory, the server admin:create-shop script requires name, slug, ownerEmail, staffEmail, ownerPassword and staffPassword arguments. Provision from a trusted operator environment because command arguments can be visible locally. The script creates Better Auth identities and factory memberships in a transaction.

## Deploy and verify

1. Take a database backup. Review server/src/db/schema.ts before applying a release. Startup calls ensureSchema. Test upgrades against an isolated copy first.
2. Build the server Dockerfile with server as its context. Configure the database connection, auth secret, public auth URL, exact CORS origins and the verified proxy hop count at runtime.
3. Check /health for liveness and /ready for database connectivity. For phone-only failures confirm the embedded API origin and network reachability. For browser-only failures inspect exact-origin CORS.
4. Set the Expo API origin before building with the EAS preview profile. Verify app identifiers and signing ownership before distributing an internal build.
5. Run the factory walkthrough in docs/demo.md using a demo tenant. Verify both roles, a retried receipt and session persistence after restarting the app. Confirm the order and ledger balances before approving the release.

## Operate and recover

Use request IDs and sanitized logs to investigate failed calls. Keep tokens, buyer contacts and full request bodies out of incident notes. Confirm the provider's backup retention and restore a backup into an isolated Postgres database before pilot use. Compare membership counts, order totals and ledger balances. Record the drill and recovery time.

Roll back the API and app to reviewed compatible versions if needed. Verify an isolated database restore before switching the API to it. Coordinate credential rotation with a readiness and sign-in check.

The admin:delete-shop script requires matching shop and confirm arguments. Verify factory identity, authorization, retention obligations and backup expiry before removal. Test removal on an isolated database before using it operationally.

## Verification

Use each package's lint, typecheck and test scripts. API tests use PGlite. The k6 scenario in scripts/load/orders.js verifies demo ownership and identity before writing synthetic orders. Its target thresholds are test criteria. A single-IP load run can hit the API quota. Record the environment and actual results before making capacity claims.
