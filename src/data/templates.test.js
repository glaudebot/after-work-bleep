import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const templates = JSON.parse(readFileSync(new URL('./templates.json', import.meta.url)));

test('템플릿: id 중복 없음, {XX}·{YY} 한 번씩, 색은 #rrggbb', () => {
  assert.equal(new Set(templates.map((t) => t.id)).size, templates.length);
  for (const t of templates) {
    assert.equal(t.text.split('{XX}').length, 2, t.id);
    assert.equal(t.text.split('{YY}').length, 2, t.id);
    for (const k of ['bg', 'ink', 'sub', 'nameColor', 'markBg', 'markFg']) assert.match(t[k], /^#[0-9a-f]{6}$/, `${t.id}.${k}`);
  }
});
