import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { Config } from '../config';
export function initFirebase(config: Config) {
  return (
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  );
}
