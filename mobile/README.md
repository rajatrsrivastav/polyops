# PolyOps for iOS and Android

Factory administrators and dispatch staff use PolyOps to track materials, reserve stock for business buyers and dispatch orders. The app runs on Expo SDK 58 with Expo Router. The app connects to the shared Express API using a Better Auth bearer session.

## Run locally

1. From the repo root run `npm run dev:server`.
2. Set `EXPO_PUBLIC_API_URL` privately to the Express server origin reachable from your phone, such as `http://<laptop-LAN-IP>:3000`.
3. In another terminal run `npm run dev:mobile` and open the project on the device. If you use a Metro tunnel, the phone still needs a separate route to the API.
4. Sign in with a provisioned account. For synthetic seed users and setup, see the [root README](../README.md).

## Workflows

- **Admin:** Create, edit and archive materials, receive stock, review movements, create buyer orders, update dispatch, cancel eligible orders, view 7- and 30-day reports and prepare the weekly brief.
- **Staff:** Find materials, receive stock, review movements, pack and dispatch the day's buyer orders. Admin screens require the owner role, and the API independently enforces privileges.

Receipts and new orders reuse an idempotency key when the same request is retried from its screen. Stock uses whole units, and receipts can include a supplier or lot reference as free text.

## Checks

From the repo root run `npm --prefix mobile run check`. From `mobile/`, run `npx expo export --platform android` or `npx expo export --platform ios` to check Metro bundling. Test sign-in, order placement, stock receipt and dispatch on a physical phone before rollout.
