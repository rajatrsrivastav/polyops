import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextPackingStatus, deliveryRequest } from '../src/lib/packing.mjs';
test('packing actions cannot cancel, deliver, or skip a step', () => { assert.equal(nextPackingStatus('pending'), 'packed'); assert.equal(nextPackingStatus('packed'), 'shipped'); for (const status of ['shipped', 'delivered', 'cancelled']) assert.equal(nextPackingStatus(status), null); });
test('delivery retries reuse the key; edits and different products use a new key', () => { let seq = 0; const uuid = () => String(++seq); const ref = { current: null }; const first = deliveryRequest(ref, 'p1', 2, 'batch', uuid); assert.equal(first.key, deliveryRequest(ref, 'p1', 2, 'batch', uuid).key); assert.notEqual(first.key, deliveryRequest(ref, 'p1', 3, 'batch', uuid).key); assert.notEqual(first.key, deliveryRequest(ref, 'p2', 2, 'batch', uuid).key); });
