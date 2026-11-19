import 'firebase/auth';
import type AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';
// Firebase 12 exposes this in its native entry, but omits it from the default public type barrel.
// Signature verified against @firebase/auth/dist/src/platform_react_native/persistence/react_native.d.ts.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
