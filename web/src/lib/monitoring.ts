import * as Sentry from '@sentry/react';
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    release: import.meta.env.VITE_RELEASE_SHA,
    sendDefaultPii: false,
    defaultIntegrations: false,
    tracesSampleRate: 0,
    beforeSend: (event) => ({
      type: event.type,
      event_id: event.event_id,
      timestamp: event.timestamp,
      platform: 'javascript',
      level: 'error',
      release: event.release,
      message: 'Packbay client rendering failure',
    }),
  });
}
export { ErrorBoundary } from '@sentry/react';
