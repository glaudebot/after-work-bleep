import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDayPart, getMood, getWorkPhase, todayKey } from './time.js';

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

test('표정 단계: 09:00~18:00 기준 50/80/95% 경계', () => {
  const mood = (h, m = 0) => { const now = new Date(2026, 10, 13, h, m); return getMood(getWorkPhase({ start: '09:00', end: '18:00' }, now), now); };
  assert.deepEqual([mood(8), mood(9), mood(13, 29), mood(13, 30), mood(16, 11), mood(16, 12), mood(17, 32), mood(17, 33), mood(18)],
    ['sleepy', 'calm', 'calm', 'annoyed', 'annoyed', 'angry', 'angry', 'furious', 'relieved']);
  const now = new Date(2026, 10, 13, 5, 50); // 야간 22:00~06:00, 95% 지점 05:36 이후
  assert.equal(getMood(getWorkPhase({ start: '22:00', end: '06:00' }, now), now), 'furious');
});

test('배경 시간대: 06·11·18시 경계', () => {
  const part = (h) => getDayPart(new Date(2026, 10, 13, h));
  assert.deepEqual([5, 6, 10, 11, 17, 18, 23].map(part), ['night', 'morning', 'morning', 'noon', 'noon', 'night', 'night']);
});
