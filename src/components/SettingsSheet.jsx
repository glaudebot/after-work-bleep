import { useState } from 'react';

export default function SettingsSheet({ settings, onSave, onClose }) {
  const [start, setStart] = useState(settings.start);
  const [end, setEnd] = useState(settings.end);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="w-full rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">근무 시간 설정</h2>
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
        <button className="mt-6 w-full rounded-xl bg-blue-500 py-4 font-semibold text-white"
          onClick={() => { onSave({ start, end }); onClose(); }}>
          저장
        </button>
      </div>
    </div>
  );
}
