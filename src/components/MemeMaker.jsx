import { useRef, useState } from 'react';
import oaths from '../data/oaths.json';
import { captureAndShare } from '../lib/captureAndSave';

export default function MemeMaker({ collected, initialOathId, onClose }) {
  const owned = oaths.filter((o) => collected.includes(o.id));
  const [name, setName] = useState('');
  const [oathId, setOathId] = useState(initialOathId ?? owned[0]?.id);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);

  const oath = owned.find((o) => o.id === oathId) ?? owned[0];
  const xx = name.trim() || 'XX';

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

      {/* ▼ 캡처 대상 영역: Tailwind 클래스만 사용, 외부 이미지 X (CORS 이슈 방지) */}
      <div ref={cardRef} className="mx-auto mt-4 aspect-square w-full max-w-sm rounded-3xl bg-yellow-300 p-6 flex flex-col justify-center">
        <p className="text-xs font-semibold text-yellow-800">{oath.country} · {oath.original}</p>
        <p className="mt-3 break-keep text-3xl font-black leading-snug text-gray-900">
          아 우리 <span className="break-all text-blue-600">{xx}</span>님<br />
          <span className="bg-black px-2 text-white">{oath.word}</span> 같네
        </p>
        <p className="mt-4 text-xs text-yellow-800">뜻: {oath.meaning}</p>
        <p className="mt-auto text-right text-[10px] text-yellow-700">퇴근 후 삐-처리</p>
      </div>
      {/* ▲ 캡처 대상 영역 */}

      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 10))}
        placeholder="대상 이름 (최대 10자)"
        className="mt-5 w-full rounded-xl bg-white p-4 shadow-sm" />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {owned.map((o) => (
          <button key={o.id} onClick={() => setOathId(o.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${o.id === oath.id ? 'bg-blue-500 text-white' : 'bg-white'}`}>
            {o.word}
          </button>
        ))}
      </div>

      <button disabled={busy} onClick={handleSave}
        className="mt-4 w-full rounded-xl bg-blue-500 py-4 font-semibold text-white disabled:opacity-50">
        {busy ? '만드는 중…' : '이미지 저장 · 공유'}
      </button>
    </div>
  );
}
