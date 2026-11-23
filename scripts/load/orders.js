import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
const errors = new Rate('polyops_errors');
export const options = { stages: [{ duration: '20s', target: 20 }, { duration: '80s', target: 20 }, { duration: '20s', target: 0 }], thresholds: { http_req_duration: ['p(95)<500'], polyops_errors: ['rate<0.01'] } };
export function setup() {
  if (__ENV.DEMO_ONLY !== 'millet-co' || !__ENV.API_URL || !__ENV.ID_TOKEN || !__ENV.DEMO_SHOP_ID) throw new Error('Set API_URL, ID_TOKEN, DEMO_SHOP_ID and DEMO_ONLY=millet-co. Never target a pilot.');
  const response = http.get(`${__ENV.API_URL}/api/me`, { headers: { Authorization: `Bearer ${__ENV.ID_TOKEN}` } });
  const user = response.json();
  if (response.status !== 200 || user.role !== 'owner' || user.shopId !== __ENV.DEMO_SHOP_ID || user.isDemo !== true || user.shopSlug !== 'millet-co') throw new Error('The token is not the verified demo owner');
  if (__ENV.DEMO_SHOP_CONFIRMED !== 'true') throw new Error('Confirm the supplied shopId belongs to the isDemo shop in Postgres before running');
  return { runId: Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0') };
}
export default function (data) {
  const headers = { Authorization: `Bearer ${__ENV.ID_TOKEN}`, 'Content-Type': 'application/json' };
  const products = http.get(`${__ENV.API_URL}/api/products?limit=20`, { headers });
  const orders = http.get(`${__ENV.API_URL}/api/orders?limit=20`, { headers });
  errors.add(!check(products, { 'products returns 200': r => r.status === 200 }));
  errors.add(!check(orders, { 'orders returns 200': r => r.status === 200 }));
  const product = products.status === 200 ? products.json('items').find(item => item.stock > 0) : null;
  if (product) {
    // UUID format with per-VU / per-iteration uniqueness. This is a synthetic test key, not a secret.
    const key = `${data.runId}-${String(__VU).padStart(4, '0')}-4000-8000-${String(__ITER).padStart(12, '0')}`;
    const response = http.post(`${__ENV.API_URL}/api/orders`, JSON.stringify({ items: [{ productId: product._id, qty: 1 }], channel: 'other', customerName: 'Demo Polymer Fabrication', customerPhone: '9999999999' }), { headers: { ...headers, 'Idempotency-Key': key } });
    errors.add(!check(response, { 'order reserves stock': r => r.status === 201 }));
  } else errors.add(true);
  sleep(1);
}
