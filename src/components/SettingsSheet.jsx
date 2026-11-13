import { useTossBack } from '../lib/toss';
import { useState } from 'react';

export default function SettingsSheet({ title = '근무 시간 설정', settings, onSave, onClose }) {
  useTossBack(onClose);
  const [start, setStart] = useState(settings.start);
  const [end, setEnd] = useState(settings.end);
  const same = start === end; // 같으면 야간 분기로 들어가 영원히 working → 보상 없음

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="w-full rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-600">
            출근
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-xl bg-gray-100 p-3 text-base" />
          </label>
          <label className="text-sm text-gray-600">
            퇴근
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-xl bg-gray-100 p-3 text-base" />
          </label>
        </div>
        {same && start && <p className="mt-3 text-sm text-red-500">출근과 퇴근 시각이 같아요</p>}
        <button className="mt-6 w-full rounded-xl bg-blue-500 py-4 font-semibold text-white disabled:bg-gray-300"
          disabled={!start || !end || same}
          onClick={() => { onSave({ start, end }); onClose(); }}>
          저장
        </button>
      </div>
    </div>
  );
}
