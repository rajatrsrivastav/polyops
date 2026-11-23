import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bearerFetch } from '../src/lib/bearerFetch.ts';

test('native API requests omit shared cookies and preserve the supplied bearer header', async (t) => {
  const stub = t.mock.method(globalThis, 'fetch', async () => new Response('{}'));
  const headers = { Authorization: 'Bearer synthetic-test-token' };
  await bearerFetch('https://factory.example/api/me', { headers, credentials: 'include' });
  const [, options] = stub.mock.calls[0].arguments;
  assert.equal(options.credentials, 'omit');
  assert.deepEqual(options.headers, headers);
});
