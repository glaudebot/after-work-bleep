import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const oaths = JSON.parse(readFileSync(new URL('./oaths.json', import.meta.url)));
// App.jsx WEIGHT·MemeMaker.jsx RARITY와 같은 등급 (D-09)
const RARITIES = ['common', 'uncommon', 'epic', 'unique', 'legendary'];

test('단어: 형식·id 중복·등급 값', () => {
  assert.equal(new Set(oaths.map((o) => o.id)).size, oaths.length);
  for (const o of oaths) {
    for (const k of ['id', 'word', 'original', 'country', 'meaning']) assert.ok(typeof o[k] === 'string' && o[k].trim(), `${o.id}.${k}`);
    assert.ok(RARITIES.includes(o.rarity), `${o.id}.rarity`);
  }
});

test('단어: 100개 이상, 등급 개수 55/25/12/6/2 (M2-1)', () => {
  const n = Object.fromEntries(RARITIES.map((r) => [r, oaths.filter((o) => o.rarity === r).length]));
  assert.ok(oaths.length >= 100);
  assert.deepEqual(n, { common: 55, uncommon: 25, epic: 12, unique: 6, legendary: 2 });
});
