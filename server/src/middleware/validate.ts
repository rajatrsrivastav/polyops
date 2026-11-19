import type { RequestHandler } from 'express';
import { z } from 'zod';
export function validate(schemas: {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}): RequestHandler {
  return (req, res, next) => {
    res.locals.input = {
      body: schemas.body ? schemas.body.parse(req.body) : req.body === undefined ? undefined : emptyBody.parse(req.body),
      query: schemas.query?.parse(req.query),
      params: schemas.params?.parse(req.params),
    };
    next();
  };
}
export function validated<T>(res: { locals: Record<string, unknown> }): T {
  return res.locals.input as T;
}
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
export const idParams = z.object({ id: objectId }).strict();
export const pagination = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};
export const emptyQuery = z.object({}).strict();
export const emptyBody = z.object({}).strict();
export const idempotencyKey = z.uuid().optional();
export const orderStatus = z.enum(['pending', 'packed', 'shipped', 'delivered', 'cancelled']);
export const dateOnly = z.iso.date();
