# Current authorized build context

On 19 November 2026 Rajat explicitly authorized Codex to author all parts, including the reserved sections. The current baseline and docs are AI-authored. This overrides the review-only and human-doc-authoring restrictions for this implementation, not the secret or Git-write restrictions. Current session log: docs/ai-sessions/2026-11-19-d01-packbay-build.md. Future tasks should respect the remaining playbook rules and record actual authorship.

# AGENTS.md — PolyOps
## What this project is
PolyOps is a B2B factory operations app for a plastics supplier.
- Factory admins manage material grades, buyer orders, available inventory, reports and the weekly brief in Expo.
- Factory staff use Expo to receive material, pack buyer orders and record dispatch.
Source of truth for scope and design: docs/prd.md, docs/architecture.md, docs/api-contract.md,
docs/data-model.md, docs/adr/. If code and docs disagree, STOP and ask me. Do not silently pick one.
## Who you are working with
I am Rajat, the engineer who owns this codebase. I am learning. Your job is to draft, explain and
review; I make design decisions. Prefer small, explainable changes over clever ones.
## Stack (locked; do not add or swap libraries without asking me first)
- server/: Node 22, Express, TypeScript (strict), Zod, pg, better-auth, express-rate-limit,
  helmet, cors, pino / pino-http, Jest + Supertest, @electric-sql/pglite for tests.
- web/: React + Vite + TypeScript, Tailwind, React Router, React Query, Recharts. Sign-in calls the API.
- mobile/: Expo (React Native, TypeScript), Expo Router, bearer token in AsyncStorage, same REST API.
- AI: Google Gemini via the official @google/genai SDK, server-side only.
- Infra: Docker, GitHub Actions, Neon Postgres, Railway or Render (API), Vercel (web), EAS (APK).
If you think a new dependency is needed, explain why and the alternatives, then wait for my yes.
## How to work in this repo
1. Never start coding on a new task without a plan. When I say "plan only", output: files you
   will touch, the approach, risks/edge cases, test cases, and clarifying questions. NO code.
2. Make the smallest change that makes the agreed tests pass. No drive-by refactors.
3. When I ask for tests first: write failing tests from my acceptance criteria and show me
   them failing before implementing.
4. After any change, run the relevant checks and report the real output:
   `npm run lint`, `npm run typecheck`, `npm test` inside the package you changed.
   Never claim tests pass without running them.
5. When you finish, give: a summary, the list of files changed, anything you were unsure about,
   and what I should review most carefully.
## Coding standards
- TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` without a comment saying why.
- Money is integer paise (`pricePaise`, `subtotalPaise`). Never floats. Never trust prices from the client.
- Time stored in UTC; date ranges and display in Asia/Calcutta.
- Every request body, query and param is validated with Zod via `middleware/validate.ts`.
- Error shape is always `{ error: { code, message } }`. Status codes: 400 validation, 401 bad/missing
  token, 403 wrong role, 404 not found, 409 stock/illegal status/conflict, 429 rate limit, 500 unknown.
- Services throw typed `AppError`s; only `middleware/errorHandler.ts` turns errors into responses.
  Never swallow an error. Never `catch {}` without rethrowing or logging with context.
- Routes are thin: validate → call service → respond. Business logic lives in `services/`.
- Every business query filters by `shopId` taken from `req.user`, never from the request body.
- List endpoints paginate: `page`, `limit` (default 20, max 50) → `{ items, page, limit, total }`.
- Stock only changes through `services/stock.ts` and always writes an InventoryMovement.
- Order status changes only through the transition table in `services/orderStatus.ts`.
- Log with the pino logger (`req.log` in routes). No `console.log` in committed code.
  Never log tokens, passwords, phone numbers or full request bodies.
- Names: files camelCase.ts, React components PascalCase.tsx, tests `*.test.ts` in `tests/`.
## Folder rules
- server/src/routes: HTTP only. server/src/services: business logic. server/src/models: typed data access. server/src/db: Postgres schema and indexes. server/src/middleware: auth, roles, validation, rate limit, errors.
- web/src/features/<feature>/ owns its components, hooks and API calls. Shared UI in web/src/components.
- mobile/src/ mirrors the web feature names. Only authenticated owner workflows may call owner-only endpoints.
- docs/ is human-owned. You may suggest edits, but do not change docs/adr/ or docs/prd.md unless
  I explicitly ask. The only docs you edit on your own are the session log (see below) and
  docs/decisions-log.md when I ask you to record a decision.
## Hand-written zones (review only, do not rewrite)
I write these files first. You may review them and point out bugs with line numbers.
Do not rewrite them unless I say "rewrite <file>":
- server/src/middleware/auth.ts, server/src/middleware/requireRole.ts
- server/src/services/stock.ts, server/src/services/orderStatus.ts
- the sales-by-day pipeline in server/src/services/dashboard.ts
- server/src/services/ai.ts (prompt + output validation)
## Never do
- Never read, print, create or edit `.env` or `.env.*` (except `.env.example`), service-account
  JSON, or any file with keys. Ask me for variable NAMES if needed.
- Never hardcode secrets, API keys, Mongo URIs, Firebase config values or passwords.
- Never run git commit, push, merge, rebase, reset or any force operation. I do all git writes.
- Never disable, skip or delete a failing test to make checks pass. Never weaken an assertion.
- Never invent library APIs. If unsure an API exists in the installed version, say so and check
  node_modules or the package docs.
- Never add analytics, tracking, telemetry or external network calls I did not ask for.
- Never use real customer data in seeds, tests or examples. Use synthetic factory materials and business buyers in the guarded demo tenant.
- Never put the AI (Gemini) in the order, stock or auth path.
- Never mark a task done if lint, typecheck or tests fail. Report the failure instead.
## Testing rules
- Jest + Supertest against `app.ts` (no `listen`). In-process Postgres via PGlite
  (transactions and partial unique indexes). Mock bearer verification and Gemini. Do not call Neon.
- Each acceptance criterion I write gets at least one test, named "AC<n>: <criterion>".
- Must-have cases: 401 no/invalid token; 403 wrong role; 400 Zod shape; 409 insufficient stock
  with stock unchanged; concurrent reserve does not oversell; 409 illegal status transition;
  aggregation totals match inserted orders; shop A cannot read shop B's data.
- Tests must not call the network (no live authentication service, Gemini or Neon).
## Session log (MANDATORY at the end of every task)
I keep a markdown log of every Codex session in docs/ai-sessions/.
- At the start of a session I will tell you the log file, e.g.
  docs/ai-sessions/2026-11-26-d08-order-reserve.md. If I don't, ask me for it before starting.
- If the file does not exist, create it from docs/ai-sessions/_template.md.
- At the END of every task (each time you finish a piece of work, before handing back to me),
  APPEND a "### Task N" block under section 4 of that file: my prompt copied VERBATIM in a quote
  block, a short summary of your response, files changed, commands you ran with their real
  pass/fail results, open risks, and follow-ups.
- Leave "Accepted / rejected and why", "What I learned" and "Interview note" for me.
  Write "_Rajat to fill_" there. Never fill them in yourself.
- Never paste secrets, tokens, or .env contents into the log.
- Append only. Never rewrite or delete earlier entries.
