# PolyOps

PolyOps helps a plastics supplier answer a question before accepting an order: how many units of this grade are still available to promise? Receiving a delivery adds stock, accepting a buyer order reserves it, and cancellation returns it. The owner taking orders and the staff packing them see the same ledger on their phones.

For example, receiving ten units and reserving three leaves seven available for the next buyer. The movement history explains how that balance changed.

Demo factory: **PolyOps Demo Works**.

## Stack

`mobile/` uses Expo SDK 58, React Native and Expo Router. `server/` uses Express 5, TypeScript, Postgres, Better Auth and Zod. The previous Vite dashboard in `web/` is paused.

```mermaid
flowchart LR
  App["PolyOps Expo app"] -->|bearer token| API["Express REST API"]
  Auth["better-auth"] -->|email + password| API
  API -->|shop-scoped transactions| PG[("Neon Postgres")]
  API -->|aggregate JSON only| Gemini["Gemini"]
  API -->|sanitized errors, optional| Sentry["Sentry"]
```

## What is implemented

- Email/password authentication via better-auth, mobile bearer sessions, role-based access and shop isolation.
- Strict Zod validation, typed errors, exact-origin CORS, Helmet, safe structured logging (pino) and rate limits.
- Product search, pagination, soft archive and inventory movement ledger.
- Atomic multi-item orders with server-side pricing, merged duplicate items and optional idempotency keys.
- Conditional status transitions; cancellation returns stock in a single transaction.
- Integer-paise analytics with IST day boundaries, zero-filled periods and cancelled sales excluded.
- Weekly Gemini brief: aggregate data only, output/number checks, generation lease, weekly cache, quota, timeout and template fallback.
- Factory admin screens in Expo for catalog, buyer orders, inventory, dispatch, reports and the weekly brief. Staff have a separate set of actions in the same app.
- Stock and order quantities are whole units. Structured lots, weight tracking and production yield are outside the current inventory contract.
- Demo seeding, admin scripts, Docker image, CI workflow and migration scripts.

## Layout

```
├── server/          Express 5 API (Node 22, TypeScript strict, pg, better-auth)
│   ├── src/
│   │   ├── db/          pool, schema, store
│   │   ├── lib/         auth, logger, appError, time, monitoring
│   │   ├── middleware/  auth, requireRole, validate, errorHandler
│   │   ├── routes/      HTTP-only route handlers
│   │   └── services/    business logic (products, orders, stock, dashboard, ai)
│   ├── scripts/         seed, admin, migrations, load tests
│   └── tests/           Jest + Supertest + PGlite
├── web/             Paused Vite dashboard
├── mobile/          Factory app (Expo SDK 58 + Expo Router)
│   └── src/
│       ├── app/         sign-in, factory desk, admin, stock and dispatch
│       ├── features/    mobile admin controls and data
│       ├── components/  shared UI
│       └── lib/         API client, session and packing logic
└── docs/            PRD, architecture, API contract, data model, ADRs, runbook
```

## Prerequisites

- **Node.js** ≥ 22.12 (within the Node 22 line)
- **npm**
- A **Postgres** database (Neon recommended, or any Postgres ≥ 15)

## Local setup

### 1. Install dependencies

```sh
npm install --prefix server
npm install --prefix mobile
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host/polyops?sslmode=verify-full` |
| `BETTER_AUTH_SECRET` | ✅ | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `BETTER_AUTH_URL` | ✅ | `http://localhost:3000` |
| `CORS_ORIGINS` | ✅ | `http://localhost:5173` (comma-separated exact origins, no trailing slash) |
| `EXPO_PUBLIC_API_URL` | ✅ (mobile) | `http://<laptop-LAN-IP>:3000` |
| `GEMINI_API_KEY` | Optional | Your Gemini API key (without it, the weekly brief uses a template fallback) |
| `GEMINI_MODEL` | Optional | e.g. `gemini-2.0-flash` |
| `SENTRY_DSN` | Optional | Sentry project DSN |
| `LOG_LEVEL` | Optional | `info` (default), `debug`, `trace`, etc. |
| `PORT` | Optional | `3000` (default) |
| `TRUST_PROXY_HOPS` | Optional | `0` (default); set for reverse proxies |

Do not commit `.env` or any file containing secrets.

### 3. Run the database schema

The schema is applied automatically on server startup (`ensureSchema`). No manual migration step is needed for first run.

### 4. Seed demo data

Set `DEMO_OWNER_PASSWORD`, `DEMO_STAFF_ONE_PASSWORD`, and `DEMO_STAFF_TWO_PASSWORD` privately to passwords of at least eight characters, then:

```sh
npm run seed
```

The seed creates synthetic plastics grades and buyer orders for PolyOps Demo Works. Sign in as `owner@millet.example` to open the admin tools. Staff accounts are `packer-one@millet.example` and `packer-two@millet.example`. `DEMO_SEED_END_DATE` changes the anchor date. Seeding is destructive to demo data only; it never modifies non-demo shops.

### 5. Start development servers

Run each in a **separate terminal**:

```sh
# API server → http://localhost:3000
npm run dev:server

# Mobile (Expo) → Expo DevTools
npm run dev:mobile
```

## PolyOps on a phone

Set `EXPO_PUBLIC_API_URL` to your laptop's LAN IP and port (not `localhost`). Phone and laptop must share a network; allow the API port on your firewall.

```sh
npm run dev:mobile
```

Scan the QR code with the Expo Go app (SDK 58 compatible build).

## Android submission and reviewer demo

The installable Android deliverable is a signed APK. The preview profile in `mobile/eas.json` requests this format. The installed app includes its JavaScript bundle. Reviewers can open it without Expo Go, Metro or the developer's laptop when the API is hosted independently.

1. Deploy the Express API with the server Dockerfile to an HTTPS host such as Render or Railway. Configure Postgres and Better Auth privately on the host. Set `BETTER_AUTH_URL` to the public API origin. Verify both `/health` and `/ready` from outside the development network.
2. Set `EXPO_PUBLIC_API_URL` to that same origin in the EAS **preview** environment before building. This public address is compiled into the APK. The database URL, auth secret and demo passwords belong outside the mobile build.
3. From `mobile/`, use an authenticated Expo account with access to the linked project and run `npx eas-cli build --platform android --profile preview`. Download the finished APK. Use the APK for the executable upload and the shareable build URL for the build-link field. Verify the link from a signed-out browser.
4. Install the downloaded APK on Android and use mobile data to run the [factory walkthrough](docs/demo.md). Give reviewers access to the synthetic demo factory and share sign-in credentials privately. Keep the API and database available throughout evaluation.

For a presenter-led demo, an HTTPS ngrok tunnel to the local **API port** also works if the laptop, API and tunnel stay running. The APK must point to that tunnel's origin. An Expo development tunnel only serves the development bundle. If the embedded API origin changes, build a new APK.

**Submission links:** [repository](https://github.com/rajatrsrivastav/polyops) · [AI session history](https://github.com/rajatrsrivastav/polyops/tree/main/docs/ai-sessions) · [Expo APK guide](https://docs.expo.dev/build-reference/apk/).

## Verification

```sh
# Server: lint, typecheck, tests
npm --prefix server run check

# Mobile: lint, typecheck, tests
npm --prefix mobile run check

# Both packages from the root:
npm run check
```

Server tests run against PGlite (in-process Postgres). Bearer verification and Gemini are mocked. Tests do not call any external service. Key test cases: concurrent reservations, stock rollback, cancellation races, role restrictions, cross-shop isolation, IST aggregation and AI fallback/cache guards.

## Build for production

```sh
npm --prefix server run build
(cd mobile && npx expo export --platform android)
```

## Docker

```sh
docker compose --profile api up --build
```

The API Dockerfile uses a multi-stage build (`node:22-slim`), runs as a non-root user, and includes a healthcheck on `/health`.

## Admin scripts

```sh
cd server
npm run admin:create-shop     # provision a new shop
npm run admin:delete-shop     # remove a shop
```

## Deployment

- **API**: Build `server/Dockerfile`, deploy to Railway or Render. Set all required env vars. `TRUST_PROXY_HOPS` must match your proxy chain.
- **Mobile**: Build with EAS (`npx eas-cli@latest build --platform android --profile preview`).
- **Postgres**: Use Neon (or any managed Postgres). Production requires the indexes from `server/scripts/migrations/`.

See [the runbook](docs/runbook.md) for operational details. Complete [privacy](docs/privacy.md), backups and the launch checklist before using real customer data.

## Documentation

The requirements and operating guides below describe the factory workflows. Dated session records preserve their original context.

- [PRD](docs/prd.md) — product requirements
- [Architecture](docs/architecture.md) — system design
- [API Contract](docs/api-contract.md) — REST endpoint reference
- [Data Model](docs/data-model.md) — Postgres schema
- [ADRs](docs/adr/) — architecture decision records
- [Implementation Status](docs/implementation-status.md) — what is verified
- [Runbook](docs/runbook.md) — deployment and operations
- [Privacy](docs/privacy.md) — data handling

## How I used AI

Codex authored this implementation, including sections originally reserved for hand-writing, after Rajat explicitly authorized that change. The [session log](docs/ai-sessions/2026-11-19-d01-packbay-build.md) records observed failures, checks, assumptions and review tasks. [ADRs](docs/adr/) capture implementation choices for human review.
