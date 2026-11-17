# FactoryEase — AI Chat History (Principal Engineer Log)

| Field | Value |
|-------|-------|
| **Product** | FactoryEase — mobile ops for a single factory (owner + employees) |
| **Session** | Cursor agent conversation `df5eae3b-c390-4a15-80d3-65703917eed6` (“FactoryEase scaffold”) |
| **Period** | 2026-11-17 → 2026-11-18 (IST) |
| **Method** | Phased prompts (0–9); plan → scaffold → features → offline → review |
| **Repo** | Local workspace `app-dev` (also published as GitHub `rajatrsrivastav/flux`) |
| **Status** | Feature-complete v1 + offline queue + EAS config + printable user guide |
| **Maintainer note** | This file is the canonical submission artifact for “AI Chat History”. Update it after each major prompt; do not rely on a one-line comment. |

---

## 1. Engagement brief

**Human goal:** Help a non-technical factory owner (father) run daily operations from a phone: expenses with bill photos, employee attendance, invoices & delivery challans (PDF), basic reports, offline tolerance, large-tap UI, English + Hindi.

**AI role:** Principal engineer — lock architecture before code, enforce stack constraints, ship incrementally per prompt, refuse scope creep unless critical, leave an auditable decision trail.

**Non-negotiable stack (locked Prompt 0 → confirmed):**

| Layer | Choice |
|-------|--------|
| Runtime | Expo + React Native + TypeScript (strict) |
| Navigation | Expo Router (`src/app/`) |
| Client state | Zustand |
| Server/cache | TanStack Query (+ AsyncStorage persist) |
| Styling | NativeWind |
| Validation | Zod (+ React Hook Form) |
| Backend | Supabase (Auth, Postgres, Storage, RLS) |
| Offline | Zustand write-queue + NetInfo flush |
| PDF | `expo-print` HTML → PDF + `expo-sharing` |
| Roles | `owner` \| `employee` via `profiles.role` |
| Auth | Email + password |
| Scope | **One factory** in v1 |

**Explicitly out of scope for v1:** multi-factory, payroll, GST filing, AI OCR of bills, complex inventory.

---

## 2. Chronological build log

### Prompt 0 — Architecture & Constraints  
**When:** 2026-11-17 ~20:59 IST  
**Human:** Architecture-only plan; no code yet.  
**AI outcome:** Full phase-0 plan — tech table, feature-based folders, data model sketch, RLS/role model, offline strategy, UI principles (~48dp targets), phased delivery map.  
**Decision:** Prefer NativeWind, daily attendance marks + optional clock-in/out, employee logins in v1, English PDFs with i18n keys ready.  
**Human follow-up:** `confrim` → plan locked; `go` → scaffold authorized.

### Prompt 1 (implicit) — Scaffold  
**When:** 2026-11-17 ~22:05 IST  
**Human:** `go`  
**AI outcome:** Greenfield Expo SDK **58** app; NativeWind 4.x; Zustand; TanStack Query; Zod; RHF; Supabase client; feature shells under `src/features/*`; route shells for auth / owner tabs / employee; initial SQL migration + RLS + storage buckets; `.env.example`.  
**Verification:** `tsc --noEmit` clean; Metro iOS bundle OK; `expo-doctor` 20/20.  
**Incidents fixed during scaffold:**
- Sandbox `EPERM` on `create-expo-app` → re-run with full permissions.
- Existing README blocked template write → remove/retry.
- CSS module TS2882 → `src/types/css.d.ts`.

### Prompt 2 — Authentication & Roles  
**When:** 2026-11-17 ~22:24 IST  
**Human:** Email/password; role from `profiles`; owner full access; employee attendance-only; logout.  
**AI outcome:** `useAuthBootstrap` + SecureStore session; `AuthGate` on `(owner)` / `(employee)` layouts; role-based redirect; logout clears auth store + query cache; seed SQL for owner/employee bootstrap.  
**Risk noted:** First owner still requires SQL seed (no in-app factory onboarding).

### Prompt 3 — Core Data Layer & Schema  
**When:** 2026-11-17 ~22:29 IST  
**Human:** Typed schema + hooks for expenses, employees, attendance, customers, invoices/items, challans/items; loading/error; optimistic creates; offline-ready boundaries.  
**AI outcome:** Simplified factory-scoped tables (`factory_id`, `client_id`); APIs + hooks with optimistic updates; shared `database` types; screens consume hooks only (no raw Supabase in UI).  
**Note:** Re-apply init migration if older draft schema was applied (column renames).

### Prompt 4 — Attendance Module  
**When:** 2026-11-17 ~22:34 IST  
**Human:** Large-tap employee check-in/out + 30-day history; owner today roster + monthly summary.  
**AI outcome:** Employee today banner + Check In/Out; owner Present/Absent/Half-day; monthly summary; `useMyEmployee` / `useMonthlyAttendance`.  
**Ops dependency:** `employees.profile_id` must link Auth user or employee sees “Account not linked”.

### Prompt 5 — Daily Expense Tracking  
**When:** 2026-11-17 ~22:41 IST  
**Human:** Fast add (amount, category chips, note, optional photo); today/month lists; filters; totals; edit/delete.  
**AI outcome:** Camera/gallery → Supabase `bill-photos`; storage RLS migration; edit route; dashboard today total; optimistic CRUD.  
**Categories locked:** Raw Material, Labor, Transport, Utility, Other.

### Prompt 6 — Invoice & Challan Generation  
**When:** 2026-11-17 ~22:56 IST  
**Human:** Customers; invoice with lines + GST; simpler delivery challan; PDF preview/share in ~60s.  
**AI outcome:** Documents hub (Invoices / Challans / Customers); auto numbers `INV-YYYYMMDD-###` / `DC-YYYYMMDD-###`; GST chips 0/5/12/18; factory letterhead on PDF; share via system sheet (WhatsApp/Files).  
**Fallback:** Missing numbers → `INV-DRAFT` / `DC-DRAFT` for type safety.

### Prompt 7 — Dashboard & Reports  
**When:** 2026-11-17 ~23:17 IST  
**Human:** Owner home summaries + quick actions; monthly report share/export.  
**AI outcome:** `useOwnerDashboard` + `useMonthlyReport`; attendance/expense/invoice glance; quick actions; shareable monthly PDF; no new tables.

### Prompt 8 — Offline Support & Polish  
**When:** 2026-11-17 ~23:20 IST  
**Human:** Queue expense + attendance offline; sync on reconnect; offline indicator; cache recent data; polish (skeletons, errors, empty CTAs); EN/HI.  
**AI outcome:** Offline queue store + `flushOfflineQueue` + NetInfo; 7-day query persist; amber banner; toasts; skeletons; EmptyState CTAs; simple `en`/`hi` i18n + LanguageToggle.  
**Scope honesty:** Offline covers **expense.create** and **attendance.upsert** only; invoices/customers/edits remain online-first.

### Prompt 9 — Final Review & Deployment Prep  
**When:** 2026-11-17 ~23:29 IST (completed after context resume)  
**Human:** PE review of debt/risks; top 5 reliability; EAS Android-first (+ iOS); 1-page printable father guide; **no new features unless critical**.  
**AI outcome:**
- `docs/REVIEW.md` — debt + top-5 reliability
- `eas.json` — development / preview (APK) / production (AAB); iOS profiles
- `app.json` — `com.factoryease.app`, versionCode/buildNumber, camera permissions, EAS placeholders
- `USER_GUIDE.md` — one-page owner guide
- README + npm scripts for EAS builds  
**No product features added.**

### Meta — Submission / chat-history maintenance  
**When:** 2026-11-18 ~00:36–00:42 IST (adjacent + this turn)  
**Human:** Portal needs Repository + AI Chat History + Submission Link; asked to find/maintain the MD chat-history file (“until now it’s a single comment”).  
**AI outcome:** This document — full PE-grade history replacing the missing/stub log.

---

## 3. Architecture decision record (condensed)

| ID | Decision | Rationale | Trade-off |
|----|----------|-----------|-----------|
| ADR-1 | Feature folders under `src/features/*`; routes only in `src/app` | Keeps Expo Router thin; scales modules without god folders | Slight path discipline required |
| ADR-2 | Supabase + RLS as source of truth | Auth + DB + Storage in one vendor; fits MSME speed | Bootstrap/seed friction for first owner |
| ADR-3 | TanStack Query for reads; Zustand for auth + offline queue | Clear split: server cache vs durable client concerns | Two stores to reason about |
| ADR-4 | Daily attendance status + optional clock times | Matches “simple for father” + worker check-in | Not a full time-clock / payroll system |
| ADR-5 | HTML → PDF via `expo-print` | Ship WhatsApp-shareable docs fast | Not CA/GST-lawyer grade templates |
| ADR-6 | Partial offline (writes queue for expense/attendance) | Highest-frequency factory actions under bad network | Docs/customers still need connectivity |
| ADR-7 | NativeWind over StyleSheet sprawl | Consistent large-tap tokens | Coupled to NativeWind/Expo CSS pipeline |
| ADR-8 | Android preview APK first | Father’s phone distribution without Play review delay | Manual sideload + EAS secrets required |

---

## 4. Key artifacts produced

| Path | Purpose |
|------|---------|
| `supabase/migrations/20261117120000_init_factoryease.sql` | Core schema + RLS |
| `supabase/migrations/20261117123000_bill_photos_storage_policies.sql` | Bill photo storage policies |
| `supabase/seed.sql` | Owner/employee bootstrap |
| `src/features/**` | Auth, expenses, attendance, invoices, challans, reports, employees |
| `src/shared/store/offline-queue-store.ts` + sync hooks | Offline write queue |
| `eas.json` / `app.json` | EAS Android/iOS build profiles |
| `USER_GUIDE.md` | Printable owner guide |
| `docs/REVIEW.md` | Debt & reliability priorities |
| `docs/AI_CHAT_HISTORY.md` | This file |

---

## 5. Verification & quality gates run

- TypeScript: `tsc --noEmit` (kept clean across phases)
- Expo Doctor: 20/20 at scaffold
- Metro bundle smoke (iOS) at scaffold
- Lint available via `expo lint`
- Manual offline path described: airplane mode → queue → reconnect → flush

---

## 6. Open risks (post Prompt 9) — do not treat as done

1. Untyped Supabase rows (`as Expense` casts) — schema drift is runtime-only  
2. Manual SQL bootstrap for owner/factory  
3. Fragile employee ↔ Auth linking (`profile_id`)  
4. Partial offline + weak failed-queue UX  
5. Invoice/challan number race under concurrency  
6. Incomplete Hindi on forms  
7. No CI/e2e; EAS builds need `EXPO_PUBLIC_*` secrets  
8. `app.json` still has EAS `projectId` / `owner` placeholders until `eas build:configure`

**Top reliability next steps (from review):** EAS secrets + smoke checklist; queue failure/retry UX; idempotent doc numbers; generated DB types in CI; owner onboarding + employee admin UI.

---

## 7. How to use this file for portal submission

**AI Chat History field:** paste the raw GitHub URL to this file after push, e.g.

`https://github.com/<owner>/<repo>/blob/main/docs/AI_CHAT_HISTORY.md`

Optionally also share the Cursor chat link (Chat → Share) as secondary evidence of the live session.

**Maintenance rule:** After each future prompt or major decision, append a dated section under §2 (Chronological build log) and bump the Status row in the header table. Never collapse this into a one-line comment again.

---

## 8. Prompt → outcome matrix (executive)

| Prompt | Theme | Shipped? |
|--------|-------|----------|
| 0 | Architecture lock | ✅ Plan only |
| 1 | Scaffold | ✅ Expo 58 + folders + migration |
| 2 | Auth & roles | ✅ |
| 3 | Data layer | ✅ |
| 4 | Attendance | ✅ |
| 5 | Expenses + photos | ✅ |
| 6 | Invoices / Challans PDF | ✅ |
| 7 | Dashboard / Reports | ✅ |
| 8 | Offline + polish + i18n | ✅ (partial offline by design) |
| 9 | Review + EAS + user guide | ✅ Docs/config only |

---

*End of maintained AI chat history through Prompt 9 + history-file creation (2026-11-18).*
