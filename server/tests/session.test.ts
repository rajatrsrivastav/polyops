import request from 'supertest';
import { createApp } from '../src/app';
import { query } from '../src/db/pool';
import { Shop, User } from '../src/models';
import { insertAuthUser } from '../src/services/identity';
const app = createApp({
  corsOrigins: ['http://localhost:5173'],
  logLevel: 'silent',
  trustProxyHops: 0,
  rateLimitMax: 10000,
  mountAuth: true,
});
const db = { query };
async function provision(email: string, password: string, withAppUser: boolean) {
  const shop = await Shop.create({ name: 'PolyOps Demo Works', slug: `shop-${email}`, isDemo: true });
  const authUserId = await insertAuthUser(db, { email, name: 'Demo', password });
  if (withAppUser) {
    await User.create({ authUserId, shopId: shop._id, role: 'owner', email });
  }
  return { shopId: shop._id, authUserId };
}
async function signIn(email: string, password: string) {
  return request(app).post('/api/auth/sign-in/email').send({ email, password });
}
describe('Better Auth bearer sessions', () => {
  test('sign-in returns a bearer token and a provisioned user can call /api/me', async () => {
    await provision('owner@example.test', 'synthetic-password', true);
    const signed = await signIn('owner@example.test', 'synthetic-password');
    expect(signed.status).toBe(200);
    const token = String(signed.headers['set-auth-token'] || signed.body.token || '');
    expect(token.length).toBeGreaterThan(10);
    const me = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.role).toBe('owner');
    expect(me.body.shopId).toMatch(/^[a-f0-9]{24}$/);
    expect(me.body.id).toMatch(/^[a-f0-9]{24}$/);
  });
  test('public email sign-up stays closed', async () => {
    const response = await request(app)
      .post('/api/auth/sign-up/email')
      .send({ email: 'new@example.test', password: 'synthetic-password', name: 'New' });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
  test('a valid session with no app user is 403 and an expired session is 401', async () => {
    await provision('stranger@example.test', 'synthetic-password', false);
    const signed = await signIn('stranger@example.test', 'synthetic-password');
    const token = String(signed.headers['set-auth-token'] || signed.body.token || '');
    expect((await request(app).get('/api/me').set('Authorization', `Bearer ${token}`)).status).toBe(
      403,
    );
    await query(`UPDATE "session" SET "expiresAt" = now() - interval '1 minute'`);
    expect((await request(app).get('/api/me').set('Authorization', `Bearer ${token}`)).status).toBe(
      401,
    );
  });
});

describe('demo owner password recovery', () => {
  test('rotates the seeded owner credential and revokes its existing bearer session', async () => {
    const { resetDemoOwner } = await import('../scripts/admin/resetDemoOwner');
    const email = 'owner@millet.example';
    const { shopId } = await provision(email, 'synthetic-before', true);
    await query("UPDATE shops SET slug = 'millet-co' WHERE id = $1", [shopId]);
    const signed = await signIn(email, 'synthetic-before');
    expect(signed.status).toBe(200);
    const token = String(signed.headers['set-auth-token'] || signed.body.token);
    await resetDemoOwner('synthetic-after');
    expect((await request(app).get('/api/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    expect((await signIn(email, 'synthetic-before')).status).toBe(401);
    expect((await signIn(email, 'synthetic-after')).status).toBe(200);
  });

  test('refuses to change an owner in a non-demo shop with the same slug', async () => {
    const { resetDemoOwner } = await import('../scripts/admin/resetDemoOwner');
    const email = 'owner@millet.example';
    const { shopId } = await provision(email, 'synthetic-before', true);
    await query("UPDATE shops SET slug = 'millet-co', is_demo = FALSE WHERE id = $1", [shopId]);
    await expect(resetDemoOwner('synthetic-after')).rejects.toThrow('demo owner was not found');
    expect((await signIn(email, 'synthetic-before')).status).toBe(200);
  });
});
