import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, dateTime, retryKey } from '../src/lib/format.mjs';
test('money converts integer paise to rupees once', () => { assert.equal(money(123450), '₹1,234.50'); assert.equal(money(0), '₹0.00'); });
test('timestamps display the Indian local day across UTC midnight', () => { assert.match(dateTime('2026-11-18T19:00:00Z'), /19 Nov|Nov 19/); });
test('uncertain retries reuse a key while changed orders get a new key', () => { const ref = { current: null }; const first = retryKey(ref, { qty: 1 }); assert.equal(first, retryKey(ref, { qty: 1 })); assert.notEqual(first, retryKey(ref, { qty: 2 })); });
