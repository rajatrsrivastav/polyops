import { initMonitoring } from './lib/monitoring';
import { createApp } from './app';
import { readConfig } from './config';
import { initAuth } from './lib/auth';
import { connectDatabase, disconnectDatabase } from './db/pool';
import { ensureSchema } from './db/schema';
import { createLogger } from './lib/logger';
const logger = createLogger();
async function main() {
  const config = readConfig(process.env);
  initMonitoring();
  await connectDatabase(config.DATABASE_URL);
  initAuth({
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    trustedOrigins: config.CORS_ORIGINS,
  });
  await ensureSchema();
  const app = createApp({
    corsOrigins: config.CORS_ORIGINS,
    logLevel: config.LOG_LEVEL,
    trustProxyHops: config.TRUST_PROXY_HOPS,
    mountAuth: true,
  });
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info({ port: config.PORT }, 'PolyOps API listening');
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
      void disconnectDatabase()
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
  const configError =
    error instanceof Error && error.message.startsWith('Invalid configuration variables:');
  logger.fatal(
    {
      reason: configError
        ? error.message
        : 'Startup failed; check database access and auth configuration',
    },
    'PolyOps could not start',
  );
  process.exit(1);
});
