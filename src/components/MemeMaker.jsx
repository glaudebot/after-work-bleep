import { useEffect, useRef, useState } from 'react';
import oaths from '../data/oaths.json';
import templates from '../data/templates.json';
import { captureAndShare, preloadCapture } from '../lib/captureAndSave';
import MemeCard, { BLEEP } from './MemeCard';
import PickerSheet from './PickerSheet';

export const RARITY = { common: ['일반', '#6b7280'], uncommon: ['고급', '#16a34a'], epic: ['에픽', '#9333ea'], unique: ['유니크', '#dc2626'], legendary: ['전설', '#d97706'] };

export default function MemeMaker({ collected, initialOathId, onClose }) {
  const owned = oaths.filter((o) => collected.includes(o.id));
  const [name, setName] = useState('');
  const [oathId, setOathId] = useState(initialOathId ?? owned[0]?.id);
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [picker, setPicker] = useState(null); // 'template' | 'word' | null
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);
  useEffect(() => { preloadCapture().catch(() => {}); }, []); // 실패는 저장 때 다시 시도

  const oath = owned.length && oathId === BLEEP.id ? BLEEP : owned.find((o) => o.id === oathId) ?? owned[0];
  const xx = name.trim() || 'XX';
  const template = templates.find((t) => t.id === templateId);

  const handleSave = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const result = await captureAndShare(cardRef.current, { filename: `bleep_${Date.now()}.png` });
      if (result === 'downloaded') alert('이미지를 저장했어요');
    } catch (e) {
      console.error(e);
      alert('이미지 저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (!oath) {
    return (
      <div className="fixed inset-0 z-40 bg-gray-50 p-5">
        <button className="text-gray-500" onClick={onClose}>← 뒤로</button>
        <p className="mt-10 text-center">아직 모은 단어가 없어요. 퇴근하고 받아보세요!</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-gray-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <button className="text-gray-500" onClick={onClose}>← 뒤로</button>

      <div className="mt-4"><MemeCard template={template} oath={oath} name={xx} cardRef={cardRef} /></div>

      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 10))}
        placeholder="대상 이름 (최대 10자)"
        className="mt-5 w-full rounded-xl bg-white p-4 shadow-sm" />

      {[['template', '템플릿', template.name], ['word', '단어', oath.word]].map(([key, label, value]) => (
        <button key={key} onClick={() => setPicker(key)}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <span className="text-sm text-gray-500">{label}</span>
          <span className="font-semibold">{value} ▾</span>
        </button>
      ))}

      <button disabled={busy} onClick={handleSave}
        className="mt-4 w-full rounded-xl bg-blue-500 py-4 font-semibold text-white disabled:opacity-50">
        {busy ? '만드는 중…' : '이미지 저장 · 공유'}
      </button>

      {picker === 'template' && (
        <PickerSheet title="템플릿 고르기" onClose={() => setPicker(null)}>
          {templates.map((t) => (
            <button key={t.id} aria-label={t.name} onClick={() => { setTemplateId(t.id); setPicker(null); }}
              className={`overflow-hidden rounded-2xl p-1 ${t.id === templateId ? 'ring-2 ring-blue-500' : ''}`}>
              {/* 미리보기는 캡처 대상이 아니라 zoom으로 줄임 */}
              <div className="mx-auto text-left" style={{ width: 335, zoom: 0.44 }}><MemeCard template={t} oath={oath} name={xx} /></div>
              <p className="mt-1 text-sm">{t.name}</p>
            </button>
          ))}
        </PickerSheet>
      )}
      {picker === 'word' && (
        <PickerSheet title="단어 고르기" onClose={() => setPicker(null)}>
          <button onClick={() => { setOathId(BLEEP.id); setPicker(null); }}
            className={`rounded-2xl bg-gray-50 p-3 text-center ${oath.id === BLEEP.id ? 'ring-2 ring-blue-500' : ''}`}>
            <p className="text-xs">단어 없이</p>
            <p className="mt-1 font-black text-red-500">삐-</p>
            <p className="mt-1 text-xs text-gray-400">빨간 삐- 처리</p>
          </button>
          {owned.map((o) => (
            <button key={o.id} onClick={() => { setOathId(o.id); setPicker(null); }}
              className={`rounded-2xl bg-gray-50 p-3 text-center ${o.id === oath.id ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-xs">{o.country}</p>
              <p className="mt-1 truncate font-bold">{o.word}</p>
              <p className="mt-1 text-xs font-semibold" style={{ color: RARITY[o.rarity][1] }}>{RARITY[o.rarity][0]}</p>
            </button>
          ))}
        </PickerSheet>
      )}
    </div>
  );
}
