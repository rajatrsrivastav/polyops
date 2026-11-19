# Packbay Staff

Expo SDK 55 and SDK-compatible React Native, Expo Router, AsyncStorage and expo-crypto. `npm run check` validates types/lint/packing helpers. `npx expo install --check` checks the compatibility map. `npx expo export --platform android` verifies Metro’s Android bundle, not APK signing or real phone behavior.

Configure EXPO_PUBLIC_API_URL as the laptop’s actual LAN origin and the four EXPO_PUBLIC_FIREBASE_* names from the root example. Expo replaces direct process.env.EXPO_PUBLIC_* access at build time. Same network and a reachable API port are required. Start `npm start`; use a matching Expo Go version from expo.dev/go or an EAS preview APK.

Auth: Firebase 12’s React Native entry exports getReactNativePersistence; initializeAuth is configured with AsyncStorage. This persists sign-in across restarts. On native fast reload, the existing Auth instance is reused; web uses getAuth. Default public declaration barrels omit the native helper even though Metro resolves it. src/types/firebaseAuth.d.ts adds the exact verified signature from the installed native declaration; no runtime shim or alternative auth implementation is used. The successful Android bundle validates import resolution. Real device restart persistence remains a manual smoke test.

Screens call only /me, /orders, /orders/:id, /orders/:id/status, /products and product movement endpoints. Revenue, prices, AI and owner catalog mutations are absent. Status buttons are disabled in flight; the server conditional transition remains the guard. Receipt retry keys are generated with Expo Crypto and retained after uncertain failures. There is no offline queue.

Sources checked: [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/), [Firebase with Expo](https://docs.expo.dev/guides/using-firebase/), and installed @firebase/auth native persistence declarations. Recheck compatibility before upgrading SDKs; do not force dependency upgrades without a new bundle and device test.
