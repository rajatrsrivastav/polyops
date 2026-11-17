# FactoryEase

Expo + React Native app for daily factory operations: attendance, expenses (with bill photos), invoices, delivery challans, and simple reports — offline-capable, large-tap UI, English/Hindi.

## Stack

Expo SDK 58 · TypeScript · Expo Router · NativeWind · Zustand · TanStack Query · Zod · Supabase

## Setup

```bash
cp .env.example .env
# set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run start
```

Apply SQL under `supabase/migrations/`, then bootstrap owner/factory with `supabase/seed.sql`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run start` | Expo dev server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | Expo lint |
| `npm run build:android:preview` | EAS Android APK (sideload) |
| `npm run build:android:production` | EAS Android App Bundle |
| `npm run build:ios:preview` | EAS iOS (device/internal) |

## EAS builds (Android first)

1. Install CLI: `npm i -g eas-cli`
2. `eas login`
3. `eas build:configure` — fills `app.json` `extra.eas.projectId` / `owner`
4. Add EAS secrets for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Preview APK for father’s phone:

```bash
eas build --platform android --profile preview
```

6. Production (Play Store AAB):

```bash
eas build --platform android --profile production
```

iOS requires an Apple Developer account. See `eas.json` and `docs/REVIEW.md`.

## Docs

- `USER_GUIDE.md` — one-page guide to print for the owner
- `docs/REVIEW.md` — technical debt and reliability priorities
- `docs/AI_CHAT_HISTORY.md` — principal-engineer AI chat / build history (Prompts 0–9); root `AI_CHAT_HISTORY.md` points here for portal submission
