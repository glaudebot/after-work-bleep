import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const templates = JSON.parse(readFileSync(new URL('./templates.json', import.meta.url)));
const oaths = JSON.parse(readFileSync(new URL('./oaths.json', import.meta.url)));

test('템플릿: id 중복 없음, {XX}·{YY} 한 번씩, 색은 #rrggbb', () => {
  assert.equal(new Set(templates.map((t) => t.id)).size, templates.length);
  for (const t of templates) {
    assert.equal(t.text.split('{XX}').length, 2, t.id);
    assert.equal(t.text.split('{YY}').length, 2, t.id);
    for (const k of ['bg', 'ink', 'sub', 'nameColor', 'markBg', 'markFg']) assert.match(t[k], /^#[0-9a-f]{6}$/, `${t.id}.${k}`);
  }
});

// 짤 만들기는 단어 분류에 맞는 템플릿과 공용만 보여 준다 (2026-11-24 사용자)
test('템플릿: 단어 분류마다 맞는 템플릿이 있고, 공용도 있음', () => {
  const types = new Set(templates.map((t) => t.type));
  assert.ok(types.has('common'));
  for (const o of oaths) assert.ok(types.has(o.type), `${o.id}.type ${o.type}`);
  for (const t of templates) assert.ok(t.type === 'common' || oaths.some((o) => o.type === t.type), `${t.id}.type`);
});
