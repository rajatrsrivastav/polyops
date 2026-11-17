# AI-Assisted Development History — flux (FactoryEase)

**Portal field:** AI Chat History  
**Repository:** https://github.com/rajatrsrivastav/flux  
**App:** FactoryEase (Expo / React Native)  
**Development period:** 17–18 November 2026 (IST, UTC+05:30)

## Provenance

This is the course/portal AI development record for this repository. It is **not** a verbatim dump of every Cursor turn. User prompts below are taken from the real build session (architecture → Prompt 9). Implementation notes are reconstructed from that session’s outcomes and the initial Git commit that published the app source.

Assistant work was done in Cursor on the local `app-dev` workspace, then published to `rajatrsrivastav/flux`.

## Actual user requests (build session)

1. **Prompt 0 — Architecture & constraints:** Plan FactoryEase for a father’s factory — attendance, expenses with bill photos, invoices/delivery challans (PDF), reports, offline-capable, large-tap EN/HI UI. Stack locked: Expo + TypeScript, Expo Router, Zustand, Supabase, NativeWind, Zod; roles owner/employee; one factory; email/password. No code yet.
2. **Confirm:** user replied `confrim` to accept the plan.
3. **Go / scaffold:** start Expo app scaffold under the workspace.
4. **Prompt 2 — Authentication & roles:** session persistence, role-based routing, protected layouts, logout.
5. **Prompt 3 — Data layer:** Supabase schema/migrations, typed hooks, seed/bootstrap notes.
6. **Prompt 4 — Attendance:** owner + employee attendance flows.
7. **Prompt 5 — Expenses:** expense CRUD with bill photo capture/attach.
8. **Prompt 6 — Invoices & challans:** document creation and PDF share via expo-print/sharing.
9. **Prompt 7 — Dashboard & reports:** owner dashboard stats and monthly report PDF.
10. **Prompt 8 — Offline & polish:** offline queue/sync, banners, skeletons, empty states, language toggle.
11. **Prompt 9 — Final review & deployment prep:** PE-style debt/risks, top reliability items, EAS Android-first (+ iOS), one-page father user guide — no new product features unless critical.
12. **Publish:** name repo `flux`, push to GitHub, fill app-dev portal fields (Repository, AI Chat History, Submission Link).

## Development summary

Greenfield Expo SDK 58 app with routes in `src/app/` and features in `src/features/`. Supabase migrations cover profiles, factories, employees, attendance, expenses, customers, invoices, challans, and bill-photo storage policies. Auth uses SecureStore-backed sessions and `AuthGate`. TanStack Query persists with AsyncStorage; Zustand holds auth, locale, network, offline queue, and toasts. Offline sync covers expense create and attendance upsert. PDFs for invoices, challans, and monthly reports. i18n English/Hindi. Prompt 9 added `eas.json`, store identifiers in `app.json`, `USER_GUIDE.md`, and `docs/REVIEW.md`.

## Git evidence

| Commit | Timestamp | Milestone |
| --- | --- | --- |
| `c5fc1af` | 2026-11-18 (push session) | Initial commit: full FactoryEase Expo app published to `flux` |
| *(this file)* | 2026-11-18 | Docs: add AI chat history for portal submission |

## Portal paste link

After this file is on `main`, submit:

**https://github.com/rajatrsrivastav/flux/blob/main/AI_CHAT_HISTORY.md**
