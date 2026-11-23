# PolyOps implementation status

The Expo app supports factory admins and floor staff. Admins manage grades, buyer orders, stock and commercial reports. Staff receive stock and record packing and dispatch. Express enforces factory membership and roles using Better Auth and Postgres. Current verification results are recorded by task in the [session log](ai-sessions/2026-11-19-d01-packbay-build.md).

Before a pilot, complete a two-role phone walkthrough, test an isolated database restore, publish contact and retention details and verify the deployed API.

## Historical verification snapshot

The following dated results describe the 19 November baseline and its dependencies.

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
