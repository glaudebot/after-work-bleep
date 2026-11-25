import { memo, useEffect, useState } from 'react';

const imgs = import.meta.glob('../assets/character/*.webp', { eager: true, import: 'default' });
// 단계가 바뀔 때 깜빡이지 않게 미리 받아 둔다
Object.values(imgs).forEach((u) => { new Image().src = u; });

// furious 그림이 없으면 angry 그림을 쓴다. 떨림·확대·붉은 빛은 그림과 상관없이 넣는다
const srcOf = (mood) => imgs[`../assets/character/${mood}.webp`] ?? imgs['../assets/character/angry.webp'];

// 누르면 통통 튀며 모은 단어(삐- 포함) 하나를 말풍선으로 외친다. 뒤에 "!", 삐-는 빨간색. 직전 단어는 빼고 고른다 (2026-11-25 사용자)
function Character({ mood, words = [] }) {
  const furious = mood === 'furious';
  const [say, setSay] = useState(null); // { word, n }: n이 바뀌면 애니메이션을 다시 튼다
  useEffect(() => {
    if (!say) return;
    const id = setTimeout(() => setSay(null), 2000);
    return () => clearTimeout(id);
  }, [say]);
  const poke = () => {
    const pool = words.filter((w) => w !== say?.word);
    const list = pool.length ? pool : words;
    if (list.length) setSay({ word: list[Math.floor(Math.random() * list.length)], n: (say?.n ?? 0) + 1 });
  };
  return (
    <div className={`relative ${furious ? 'scale-110' : ''}`}>
      {say && (
        <p key={say.n} data-bubble
          className="absolute bottom-[88%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-4 py-2 text-lg font-bold text-gray-900 shadow-md after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white">
          <span className={`block motion-safe:animate-pop ${say.word === '삐-' ? 'text-red-500' : ''}`}>{say.word}!</span>
        </p>
      )}
      {/* 장식 레이어(aria-hidden) 안이라 버튼 대신 클릭만 받는다 */}
      <img key={`img${say?.n}`} src={srcOf(mood)} alt="" data-mood={mood} draggable={false} onClick={poke}
        className={`w-full cursor-pointer select-none ${furious ? 'motion-safe:animate-shake drop-shadow-[0_0_24px_rgba(239,68,68,0.7)]' : say ? 'motion-safe:animate-boing' : ''}`} />
    </div>
  );
}

export default memo(Character);
