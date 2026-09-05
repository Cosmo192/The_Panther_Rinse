import assert from 'node:assert/strict';
import { test } from 'node:test';
import { remainingTime, sortMachines, type Machine } from '../src/utils/machines.ts';

const now = Date.parse('2026-08-30T12:00:00Z');
const machine: Machine = { id: 'washer_1', type: 'washer', status: 'in_use', in_use_since: '2026-08-30T11:30:00Z', created_at: '2026-08-30T00:00:00Z' };
test('counts down from the 50-minute cycle', () => {
  assert.equal(remainingTime(machine, now), '20 min remaining');
});
test('expired cycles wait for database release', () => {
  assert.equal(remainingTime(machine, now + 21 * 60000), 'Finishing soon');
});
test('missing or invalid start time is not treated as free', () => {
  assert.equal(remainingTime({ ...machine, in_use_since: null }, now), 'Time unavailable');
  assert.equal(remainingTime({ ...machine, in_use_since: 'bad' }, now), 'Time unavailable');
});
test('free machines have no countdown', () => {
  assert.equal(remainingTime({ ...machine, status: 'free' }, now), 'Ready for your laundry');
});
test('sorts IDs naturally without mutating input', () => {
  const rows = [{ ...machine, id: 'washer_10' }, { ...machine, id: 'washer_2' }];
  assert.deepEqual(sortMachines(rows).map(row => row.id), ['washer_2', 'washer_10']);
  assert.equal(rows[0].id, 'washer_10');
});
