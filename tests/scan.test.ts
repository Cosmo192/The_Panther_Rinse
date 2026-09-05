import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanCountdown } from '../src/utils/scan.ts';
const start = '2026-08-30T12:00:00Z';
const time = Date.parse(start);
test('scan timer starts at 45 minutes and ticks by second', () => {
  assert.equal(scanCountdown(start, time), '45:00');
  assert.equal(scanCountdown(start, time + 1000), '44:59');
});
test('reload uses elapsed time, and timer never goes negative', () => {
  assert.equal(scanCountdown(start, time + 20 * 60000), '25:00');
  assert.equal(scanCountdown(start, time + 60 * 60000), '00:00');
});
test('unknown start time does not invent a countdown', () => {
  assert.equal(scanCountdown(null, time), '—:—');
});
