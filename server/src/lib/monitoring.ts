import * as Sentry from '@sentry/node';
export function initMonitoring() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.RELEASE_SHA,
    sendDefaultPii: false,
    defaultIntegrations: false,
    tracesSampleRate: 0,
    beforeSend: (event) => ({
      type: event.type,
      event_id: event.event_id,
      timestamp: event.timestamp,
      platform: 'node',
      level: 'error',
      release: event.release,
      message: 'PolyOps API internal failure',
      tags: {
        requestId: event.tags?.requestId ?? 'unknown',
        errorType: event.tags?.errorType ?? 'UnknownError',
      },
    }),
  });
}
export function reportInternalError(requestId: string, error: unknown) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureMessage('PolyOps API internal failure', {
    level: 'error',
    tags: { requestId, errorType: error instanceof Error ? error.name : 'UnknownError' },
  });
}
