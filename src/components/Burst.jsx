import { useEffect, useState } from 'react';

const imgs = import.meta.glob('../assets/character/*.webp', { eager: true, import: 'default' });
const SWELL_MS = 1000, END_MS = 2400;

// 퇴근 펑 연출 (M1.5-3): 부풀며 떨다가 → 펑 + 단어 말풍선 → onDone(보상 창). 탭하면 건너뛴다
export default function Burst({ word, onDone }) {
  const [boom, setBoom] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setBoom(true), SWELL_MS);
    const b = setTimeout(onDone, END_MS);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [onDone]);

  return (
    <div data-burst className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 p-6" onClick={onDone}>
      {boom && (
        <p className="mb-2 animate-pop rounded-2xl bg-white px-5 py-3 text-center text-3xl font-black text-red-500 shadow-lg">
          {word}!
        </p>
      )}
      {boom
        ? <img src={imgs['../assets/character/boom.webp']} alt="" draggable={false} className="w-72 animate-pop select-none [mask-image:radial-gradient(circle,black_58%,transparent_71%)]" />
        : <img src={imgs['../assets/character/furious.webp']} alt="" draggable={false} className="w-64 animate-swell select-none" />}
      <p className="mt-6 text-xs text-white/60">탭해서 건너뛰기</p>
    </div>
  );
}
