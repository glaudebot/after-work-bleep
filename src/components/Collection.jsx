import { useState } from 'react';
import oaths from '../data/oaths.json';
import { RARITY } from './MemeMaker.jsx';
import { inToss, useTossBack } from '../lib/toss';

const VIEWS = [['all', '전체'], ['country', '국가별'], ['rarity', '등급별']];
const RARE_FIRST = ['legendary', 'unique', 'epic', 'uncommon', 'common'];

// 보기별 묶음 [[소제목 키, 단어들]]. 국가는 단어 많은 순, 등급은 전설부터 (M3-1)
function groupsOf(view) {
  if (view === 'all') return [[null, oaths]];
  const key = view === 'country' ? 'country' : 'rarity';
  const m = {};
  for (const o of oaths) (m[o[key]] ||= []).push(o);
  const keys = view === 'country'
    ? Object.keys(m).sort((a, b) => m[b].length - m[a].length)
    : RARE_FIRST.filter((r) => m[r]);
  return keys.map((k) => [k, m[k]]);
}

export default function Collection({ collected, onPick, onClose }) {
  const owned = new Set(collected);
  const [view, setView] = useState('all');
  const [country, setCountry] = useState(null); // 국가별에서 고른 나라. null이면 나라 카드 그리드
  const back = country ? () => setCountry(null) : onClose;
  useTossBack(back);
  const pick = (v) => { setView(v); setCountry(null); };
  const groups = groupsOf(view);
  const shown = view === 'country' ? groups.filter(([k]) => k === country) : groups;
  const count = (list) => `${list.filter((o) => owned.has(o.id)).length}/${list.length}`;
  return (
    <section className="fixed inset-0 z-30 overflow-y-auto bg-gray-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      {!inToss && <button className="text-gray-500" onClick={back}>← 뒤로</button>}
      <h2 className="mb-3 mt-4 font-bold">
        비속어 도감 <span className="text-gray-400">{count(oaths)}</span>
      </h2>
      <div className="mb-4 flex gap-2">
        {VIEWS.map(([v, label]) => (
          <button key={v} aria-pressed={view === v} onClick={() => pick(v)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${view === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 shadow-sm'}`}>
            {label}
          </button>
        ))}
      </div>
      {view === 'country' && !country && (
        <div className="grid grid-cols-3 gap-2">
          {groups.map(([k, list]) => (
            <button key={k} data-country onClick={() => setCountry(k)}
              className="rounded-2xl bg-white p-3 text-center shadow-sm active:scale-95">
              <p className="text-2xl">{k.split(' ')[0]}</p>
              <p className="mt-1 break-keep text-xs font-bold">{k.split(' ').slice(1).join(' ')}</p>
              <p className="text-xs text-gray-400">{count(list)}</p>
            </button>
          ))}
        </div>
      )}
      {shown.map(([k, list]) => (
        <div key={k ?? 'all'} className="mb-5">
          {k && (
            <h3 data-group className="mb-2 text-sm font-bold" style={view === 'rarity' ? { color: RARITY[k][1] } : undefined}>
              {view === 'rarity' ? RARITY[k][0] : k} <span className="font-normal text-gray-400">{count(list)}</span>
            </h3>
          )}
          <div className="grid grid-cols-3 gap-2">
            {list.map((o) =>
              owned.has(o.id) ? (
                <button key={o.id} onClick={() => onPick(o)}
                  className="rounded-2xl bg-white p-3 text-center shadow-sm active:scale-95">
                  <p className="text-xs">{o.country.split(' ')[0]}</p>
                  <p className="mt-1 break-keep text-sm font-bold [overflow-wrap:anywhere]">{o.word}</p>
                </button>
              ) : (
                <div key={o.id} className="flex min-h-16 items-center justify-center rounded-2xl bg-gray-200 p-3">
                  <p className="text-xs font-black text-red-500">삐-</p>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
