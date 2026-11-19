import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { auth, currentUser } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  validate,
  validated,
  pagination,
  idParams,
  emptyQuery,
  orderStatus,
  dateOnly,
  idempotencyKey,
  objectId,
} from '../middleware/validate';
import * as products from '../services/products';
import * as orders from '../services/orders';
import * as stock from '../services/stock';
import { changeOrderStatus } from '../services/orderStatus';
import { dashboard } from '../services/dashboard';
import { Shop } from '../models';
import { weeklyBrief } from '../services/ai';
const productBody = z
  .object({
    name: z.string().trim().min(1).max(100),
    sku: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/),
    pricePaise: z.number().int().min(0).max(100000000),
    lowStockThreshold: z.number().int().min(0).max(1000000).default(5),
  })
  .strict();
const productPatch = productBody
  .extend({ lowStockThreshold: z.number().int().min(0).max(1000000) })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');
const productsQuery = z
  .object({
    ...pagination,
    q: z.string().trim().max(100).optional(),
    lowStock: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .strict();
const orderBody = z
  .object({
    items: z
      .array(z.object({ productId: objectId, qty: z.number().int().min(1).max(999) }).strict())
      .min(1)
      .max(50),
    channel: z.enum(['instagram', 'whatsapp', 'website', 'other']),
    customerName: z.string().trim().min(1).max(100),
    customerPhone: z.string().regex(/^[6-9]\d{9}$/, 'Use a ten-digit Indian mobile number'),
  })
  .strict();
const ordersQuery = z
  .object({
    ...pagination,
    status: orderStatus.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    q: z.string().trim().max(100).optional(),
  })
  .strict()
  .refine((q) => !q.from || !q.to || q.from <= q.to, 'Start must precede end');
const movementBody = z
  .object({ qty: z.number().int().min(1).max(99999), note: z.string().trim().max(200).optional() })
  .strict();
export function apiRouter() {
  const router = Router();
  router.use(auth);
  router.get('/me', validate({ query: emptyQuery }), async (req, res) => {
    const user = currentUser(req);
    const shop = await Shop.findOne({ _id: user.shopId }).select('name slug isDemo').lean();
    res.json({
      id: user.id,
      shopId: user.shopId,
      role: user.role,
      shopName: shop?.name,
      shopSlug: shop?.slug,
      isDemo: shop?.isDemo === true,
    });
  });
  router.get('/products', validate({ query: productsQuery }), async (req, res) => {
    const { query } = validated<{ query: z.infer<typeof productsQuery> }>(res);
    res.json(await products.listProducts(currentUser(req), query));
  });
  router.post(
    '/products',
    requireRole('owner'),
    validate({ body: productBody, query: emptyQuery }),
    async (req, res) => {
      const { body } = validated<{ body: z.infer<typeof productBody> }>(res);
      res.status(201).json(await products.createProduct(currentUser(req), body));
    },
  );
  router.patch(
    '/products/:id',
    requireRole('owner'),
    validate({ body: productPatch, params: idParams, query: emptyQuery }),
    async (req, res) => {
      const { body, params } = validated<{
        body: z.infer<typeof productPatch>;
        params: { id: string };
      }>(res);
      res.json(await products.updateProduct(currentUser(req), params.id, body));
    },
  );
  router.delete(
    '/products/:id',
    requireRole('owner'),
    validate({ params: idParams, query: emptyQuery }),
    async (req, res) => {
      const { params } = validated<{ params: { id: string } }>(res);
      await products.updateProduct(currentUser(req), params.id, { isActive: false });
      res.status(204).end();
    },
  );
  router.get(
    '/products/:id/movements',
    validate({ params: idParams, query: z.object(pagination).strict() }),
    async (req, res) => {
      const { params, query } = validated<{
        params: { id: string };
        query: { page: number; limit: number };
      }>(res);
      res.json(await stock.listMovements(currentUser(req), params.id, query));
    },
  );
  router.post(
    '/products/:id/movements',
    validate({ params: idParams, query: emptyQuery, body: movementBody }),
    async (req, res) => {
      const { params, body } = validated<{
        params: { id: string };
        body: z.infer<typeof movementBody>;
      }>(res);
      res
        .status(201)
        .json(
          await stock.receiveStock(
            currentUser(req),
            params.id,
            body,
            idempotencyKey.parse(req.get('Idempotency-Key')),
          ),
        );
    },
  );
  router.get('/orders', validate({ query: ordersQuery }), async (req, res) => {
    const { query } = validated<{ query: z.infer<typeof ordersQuery> }>(res);
    res.json(await orders.listOrders(currentUser(req), query));
  });
  router.post(
    '/orders',
    requireRole('owner'),
    validate({ body: orderBody, query: emptyQuery }),
    async (req, res) => {
      const { body } = validated<{ body: z.infer<typeof orderBody> }>(res);
      const actor = currentUser(req);
      res
        .status(201)
        .json(
          orders.publicOrder(
            await orders.createOrder(actor, body, idempotencyKey.parse(req.get('Idempotency-Key'))),
            actor.role,
          ),
        );
    },
  );
  router.get('/orders/:id', validate({ params: idParams, query: emptyQuery }), async (req, res) => {
    const { params } = validated<{ params: { id: string } }>(res);
    res.json(await orders.getOrder(currentUser(req), params.id));
  });
  router.patch(
    '/orders/:id/status',
    validate({ params: idParams, query: emptyQuery, body: z.object({ to: orderStatus }).strict() }),
    async (req, res) => {
      const { params, body } = validated<{
        params: { id: string };
        body: { to: z.infer<typeof orderStatus> };
      }>(res);
      const actor = currentUser(req);
      res.json(orders.publicOrder(await changeOrderStatus(actor, params.id, body.to), actor.role));
    },
  );
  router.get(
    '/dashboard',
    requireRole('owner'),
    validate({ query: z.object({ range: z.enum(['7d', '30d']).default('7d') }).strict() }),
    async (req, res) => {
      const { query } = validated<{ query: { range: '7d' | '30d' } }>(res);
      res.json(await dashboard(currentUser(req), query.range));
    },
  );
  const aiLimiter = rateLimit({
    windowMs: 3600000,
    limit: 5,
    keyGenerator: (req) => currentUser(req).id.toString(),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json({
          error: { code: 'RATE_LIMITED', message: 'Weekly brief limit reached. Try again later.' },
        });
    },
  });
  router.post(
    '/ai/weekly-brief',
    requireRole('owner'),
    aiLimiter,
    validate({ query: emptyQuery, body: z.object({}).strict() }),
    async (req, res) => {
      res.json(await weeklyBrief(currentUser(req), req.log));
    },
  );
  return router;
}
