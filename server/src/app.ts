import express, { type Request } from 'express';
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { rateLimit } from 'express-rate-limit';
import { AppError } from './lib/appError';
import { createLogger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { handleAuthRequest } from './lib/auth';
import { pingDatabase } from './db/pool';
export type AppOptions = {
  corsOrigins: string[];
  logLevel: string;
  trustProxyHops: number;
  rateLimitMax?: number;
  mountAuth?: boolean;
};
export function createApp(options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxyHops);
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });
  app.use(
    pinoHttp({
      logger: createLogger(options.logLevel),
      genReqId: (req) => req.id,
      serializers: {
        req: (req) => ({ id: req.id, method: req.method }),
        res: (res) => ({ statusCode: res.statusCode }),
        err: () => ({ type: 'RequestError' }),
      },
      customProps: (req) => {
        const actor = (req as Request).user;
        return { userId: actor?.id.toString(), shopId: actor?.shopId.toString() };
      },
      customSuccessObject: (req, _res, value) => {
        const request = req as Request;
        return {
          ...value,
          route: request.route?.path ?? 'unmatched',
          userId: request.user?.id.toString(),
          shopId: request.user?.shopId.toString(),
        };
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || options.corsOrigins.includes(origin)) callback(null, true);
        else callback(new AppError(403, 'CORS_DENIED', 'This origin is not allowed'));
      },
      exposedHeaders: ['set-auth-token'],
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: options.rateLimitMax ?? 100,
      skip: (req) => ['/health', '/ready'].includes(req.path),
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res
          .status(429)
          .json({
            error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
          });
      },
    }),
  );
  if (options.mountAuth) {
    app.use('/api/auth', (req, res, next) => {
      void handleAuthRequest(req, res).catch(next);
    });
  }
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });
  app.get('/ready', async (_req, res) => {
    try {
      await pingDatabase();
      res.json({ ok: true });
    } catch {
      throw new AppError(503, 'NOT_READY', 'Database is not ready');
    }
  });
  app.use('/api', apiRouter());
  app.use((_req, _res, next) => {
    next(new AppError(404, 'NOT_FOUND', 'Route not found'));
  });
  app.use(errorHandler);
  return app;
}
