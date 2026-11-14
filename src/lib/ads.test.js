import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adDue } from './ads.js';

const now = new Date(2026, 10, 14, 19);

test('오늘 안 봤으면 저장·공유·다운로드 뒤 광고', () => {
  for (const r of ['saved', 'shared', 'downloaded']) assert.equal(adDue(r, null, now), true);
  assert.equal(adDue('saved', '2026-11-13', now), true);
});

test('공유 취소면 안 띄움 (D-16)', () => {
  assert.equal(adDue('cancelled', null, now), false);
});

test('하루 1번 (D-16)', () => {
  assert.equal(adDue('saved', '2026-11-14', now), false);
});
