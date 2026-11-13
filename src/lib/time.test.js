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

test('퇴근 후(off)의 근무일 키는 항상 오늘: 시간을 바꿔도 같은 날 보상 두 번 불가', () => {
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  for (let s = 0; s < 1440; s += 30)
    for (let e = 0; e < 1440; e += 30) {
      if (s === e) continue; // 설정에서 막힘 (T-07a)
      for (let n = 0; n < 1440; n += 10) {
        const now = new Date(2026, 10, 13, 0, n);
        const r = getWorkPhase({ start: hhmm(s), end: hhmm(e) }, now);
        if (r.phase === 'off') assert.equal(todayKey(r.workEnd), '2026-11-13', `${hhmm(s)}~${hhmm(e)} @${hhmm(n)}`);
      }
    }
});
