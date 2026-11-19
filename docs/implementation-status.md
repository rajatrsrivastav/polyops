# Implementation status

Verified on 19 November 2026. The application source is implemented. A production launch, real-user validation and the playbook’s human learning/pilot milestones are not complete.

## Implemented source

| Area | Location | Result |
|---|---|---|
| API/auth/roles | server/src/app.ts, middleware/, lib/ | Firebase token/revocation verification, provisioned Mongo roles and shop scoping; safe config/log/error boundaries |
| Products/inventory | server/src/services/products.ts, stock.ts | Strict create/edit/archive, bounded search, movement ledger and retry-safe receipts |
| Orders | server/src/services/orders.ts, orderStatus.ts | Server pricing, merged lines, transactional multi-item reservation, conditional transitions and one-time cancellation restock |
| Analytics | server/src/services/dashboard.ts, lib/time.ts | IST day boundaries, zero-filled periods, cancelled-order exclusion and bounded top/low-stock reports |
| AI | server/src/services/ai.ts | Aggregate-only data, strict output and numeric checks, quota/cache/lease/timeout/token cap, fallback; no live provider call tested |
| Owner web | web/src/features/ | Login, overview, product management, orders, inventory/ledger and weekly brief; responsive styling and explicit states |
| Staff mobile | mobile/src/app/ | Persistent sign-in setup, today’s pick list, parcel detail/pack/ship, receive stock; no owner-only endpoints |
| Operations | server/scripts/, Dockerfile, Compose, .github/, scripts/load/ | Guarded seed/provision/removal/index scripts, container build, CI and synthetic load scenario |
| Documentation | docs/, README.md, AGENTS.md | AI-authored specifications and eight ADRs, privacy, runbook, session logs and honest metrics/feedback templates |

## Observed verification

| Check | Observed result |
|---|---|
| Server lint and strict typecheck | PASS |
| Server Jest/Supertest | PASS: 36 tests across 3 suites, actual temporary MongoDB 7 replica sets |
| Service coverage | Statements 86.11%, branches 66.08%, functions 85.36%, lines 87.5%. Coverage is diagnostic, not a release guarantee. |
| Server production compilation | PASS |
| Web lint/typecheck/helper tests | PASS: 3 tests |
| Vite production build | PASS; lazy feature chunks; upstream Zod comment-annotation warnings are nonfatal |
| Mobile lint/typecheck/helper tests | PASS: 2 tests |
| Expo dependency map | PASS: dependencies up to date |
| Android Metro export | PASS after final dependency patch; this is not a signed APK |
| Browser inspection | PASS for login/setup and privacy navigation, including a 390px phone viewport |
| Docker production image build | PASS with node:22-slim, production dependency stage and configured non-root user |
| Compose YAML validation | PASS using --env-file /dev/null |
| Runtime Docker/Compose smoke | INCOMPLETE: daemon stopped after successful image build; subsequent isolated Mongo launch could not connect |
| Git whitespace check | PASS |
| Hosted CI / Gitleaks run | NOT RUN; workflow configured, no commits or push performed |
| Actual Firebase/Gemini/provider integration | NOT RUN; no credentials/accounts were supplied or read |

Core cases include missing/invalid/unprovisioned identities, role denial, cross-shop reads/writes, strict input shape, CORS, body limits, quotas, stock rollback, concurrent last-unit orders, concurrent keyed retries, conflicting retry content, cancellation races, staff field filtering, archived-item cancellation, disconnected readiness, threshold preservation, deterministic seed isolation/reconciliation, IST aggregates, Mongo IXSCAN evidence, weekly-cache concurrency and malformed/invented/injected/provider-failure AI fallback.

## Dependency audit

Compatible patches were applied; no audit --force, Firebase downgrade or unreviewed Expo major upgrade was used. Web/mobile override @grpc/grpc-js to a patched compatible 1.x release. This dependency is pulled by Firebase’s unused Firestore package even though this application imports Auth only.

| Package | Latest observed npm audit | Remaining source |
|---|---|---|
| web | 0 advisories | None reported in this run |
| server | 8 moderate, 0 high/critical | Firebase Admin / Google Cloud transitive UUID chain; advisory concerns buffer-bound behavior in older UUID implementations |
| mobile | 14 total: 5 high, 9 moderate | Expo SDK 55 tool/router tree: decode-uri-component, glob, minimatch and Zod advisory chains |

These are actual audit findings, not claims that an exploit was reproduced. Some concern developer tooling or unused subpackages. Release requires reviewing exact reachability and a supported upgrade/patch plan, then re-running builds and phone tests. Do not present the audit as clean. Current SDK major alignment is tested; force-installing audit suggestions would break that alignment. Advisory details can be regenerated with npm audit in each package.

## Before a real pilot

- Configure Firebase, Mongo, API/web/mobile origins and optional provider names/values privately using the root example. The old root environment file was not reused. No auth bypass is shipped.
- Review AI-authored design assumptions and core files. The missing companion plan could change requirements; see prd.md.
- Resolve or explicitly assess dependency findings before shipping, run actual provider login/order/pack/receipt/brief smoke tests, build/sign/install an APK and verify restart persistence.
- Complete authenticated keyboard/zoom/contrast checks and Android TalkBack; implemented labels and target sizes are not accessibility certification.
- Publish privacy contact/retention, configure backups, perform a restore drill and review data-removal behavior in an isolated environment. Admin remote account operations are not integration-tested here.
- Review quota topology: rate-limit memory stores are per process; multiple API instances require a shared limiter. A single-IP 20-VU load test will intentionally hit the default production IP quota. No load result or capacity claim exists.
- AI output-number validation cannot establish every sentence’s semantic truth. The UI shows source figures and provider labels. A timeout cannot guarantee cancellation of already billed remote work.
- Configure deployment resources, authorized domains, exact CORS and the real proxy chain. No cloud resources, uptime monitor, pilot outreach, real data or raw transcript export were created.

## Review first

1. Atomic reservation/cancellation/retry paths in stock.ts, orders.ts and orderStatus.ts, plus the corresponding AC tests.
2. Authentication, role/tenant boundaries, staff response allowlists and production configuration.
3. AI data/output boundary, generation lease, remaining dependency advisories and all launch limitations above.

No Git history was rewritten. The earlier local-versus-GitHub history-removal question remained unanswered; this implementation follows the later playbook request and preserves its Git-write boundary.
