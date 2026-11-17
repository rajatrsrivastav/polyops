# FactoryEase — Principal Engineer Review (Prompt 9)

Date: 2026-11-17 · Scope: feature-complete Expo app with offline queue

## Remaining technical debt / risky areas

1. **No typed Supabase schema** — APIs cast row shapes (`as Expense`, etc.). Drift between SQL and TS will fail at runtime, not compile time.
2. **Owner bootstrap is manual** — First owner/factory/profile must be seeded in SQL. No in-app “create factory” flow; easy to misconfigure and get “no profile” on login.
3. **Employee linking is fragile** — Attendance for employees requires `employees.profile_id`. No polished owner UI to create roster + link Auth users in one flow.
4. **Offline queue is partial** — Only `expense.create` and `attendance.upsert` queue. Invoice/challan/customer/expense edit-delete still need network. Bill photo local URIs may expire if queued too long on some devices.
5. **Optimistic `temp_` IDs** — Offline/optimistic rows use client temp IDs; edge cases if user edits a temp expense before sync, or if sync fails repeatedly without UX for “failed queue item”.
6. **Document numbering race** — `INV-YYYYMMDD-###` / `DC-…` counted with a list+like query; two simultaneous creates can collide (unique constraint error).
7. **RLS + storage** — Correct in principle, but untested under real multi-user load; storage path policies depend on `current_factory_id()`.
8. **i18n coverage incomplete** — Hindi covers shell/dashboard/common; many form labels remain English-only.
9. **No automated tests / CI** — Typecheck exists locally; no unit/e2e or GitHub Action gate before EAS production builds.
10. **Secrets / EAS env** — `EXPO_PUBLIC_*` must be set in EAS secrets for cloud builds; local `.env` is not uploaded automatically.
11. **Unused / leftover Expo template weight** — Some Expo template packages (`@expo/ui`, glass, symbols) add surface area without product value.
12. **PDF quality** — HTML→PDF via `expo-print` is good enough; advanced GST invoices (HSN, dual GSTIN, signed invoices) are out of scope and not legally reviewed.

## Top 5 reliability improvements (do these next)

1. **EAS secrets + smoke checklist** — Put Supabase URL/anon key in EAS env; after each Android preview APK, run a fixed 10-minute script: login, expense+photo, attendance, invoice share, airplane-mode queue+sync.
2. **Queue durability UX** — Show failed offline items with last error + Retry; cap attempts; never silently leave broken photo uploads.
3. **Idempotent document numbers** — DB function or `select max` under a transaction / advisory lock so invoice/challan numbers cannot collide.
4. **Generated DB types** — `supabase gen types` wired into CI so schema drift fails the build.
5. **Owner onboarding + employee admin** — One guided screen: factory details, add employee, optional invite/link login — removes the #1 support failure mode.

## Deployment notes

- Priority path: **Android preview APK** (`eas build -p android --profile preview`) for sideload to father’s phone.
- Production Play Store later: `--profile production` (AAB).
- iOS needs Apple Developer Program + real device profile (not only simulator) for TestFlight.
- Replace placeholders in `app.json`: `extra.eas.projectId`, `owner`.
