import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWorkPhase, todayKey } from './time.js';

const at = (h) => new Date(2026, 10, 13, h);
const check = (start, end, h) => {
  const r = getWorkPhase({ start, end }, at(h));
  return [r.phase, r.target.getDate(), r.target.getHours(), todayKey(r.workEnd)];
};

test('주간 근무 09:00~18:00', () => {
  assert.deepEqual(check('09:00', '18:00', 7), ['before', 13, 9, '2026-11-13']);
  assert.deepEqual(check('09:00', '18:00', 12), ['working', 13, 18, '2026-11-13']);
  assert.deepEqual(check('09:00', '18:00', 19), ['off', 14, 9, '2026-11-13']);
});

test('야간 근무 22:00~06:00: 퇴근 뒤 오늘 밤 출근 전까지는 off', () => {
  assert.deepEqual(check('22:00', '06:00', 1), ['working', 13, 6, '2026-11-13']);
  assert.deepEqual(check('22:00', '06:00', 7), ['off', 13, 22, '2026-11-13']);
  assert.deepEqual(check('22:00', '06:00', 19), ['off', 13, 22, '2026-11-13']);
  assert.deepEqual(check('22:00', '06:00', 23), ['working', 14, 6, '2026-11-14']);
});
