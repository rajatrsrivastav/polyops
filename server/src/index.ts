import { initMonitoring } from './lib/monitoring';
import mongoose from 'mongoose';
import { createApp } from './app';
import { readConfig } from './config';
import { initFirebase } from './lib/firebase';
import { createLogger } from './lib/logger';
const logger = createLogger();
async function main() {
  const config = readConfig(process.env);
  initMonitoring();
  initFirebase(config);
  await mongoose.connect(config.MONGO_URI, {
    autoIndex: config.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 5000,
  });
  const app = createApp({
    corsOrigins: config.CORS_ORIGINS,
    logLevel: config.LOG_LEVEL,
    trustProxyHops: config.TRUST_PROXY_HOPS,
  });
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info({ port: config.PORT }, 'Packbay API listening');
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => {
      logger.error('Shutdown deadline reached');
      process.exit(1);
    }, 10000);
    deadline.unref();
    server.close(() => {
      void mongoose
        .disconnect()
        .then(() => {
          clearTimeout(deadline);
          process.exit(0);
        })
        .catch(() => {
          logger.error('Database shutdown failed');
          process.exit(1);
        });
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
void main().catch((error) => {
  // Config errors contain names only. SDK/DB failures are deliberately sanitized.
  const configError =
    error instanceof Error && error.message.startsWith('Invalid configuration variables:');
  logger.fatal(
    {
      reason: configError
        ? error.message
        : 'Startup failed; check database access and Firebase configuration',
    },
    'Packbay could not start',
  );
  process.exit(1);
});
