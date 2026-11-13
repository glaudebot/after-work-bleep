import { memo } from 'react';

const imgs = import.meta.glob('../assets/character/*.webp', { eager: true, import: 'default' });
// 단계가 바뀔 때 깜빡이지 않게 미리 받아 둔다
Object.values(imgs).forEach((u) => { new Image().src = u; });

// furious 그림이 없으면 angry 그림을 쓴다. 떨림·확대·붉은 빛은 그림과 상관없이 넣는다
const srcOf = (mood) => imgs[`../assets/character/${mood}.webp`] ?? imgs['../assets/character/angry.webp'];

function Character({ mood }) {
  const furious = mood === 'furious';
  return (
    <div className={furious ? 'scale-110' : undefined}>
      <img src={srcOf(mood)} alt="" data-mood={mood} draggable={false}
        className={`w-64 select-none ${furious ? 'motion-safe:animate-shake drop-shadow-[0_0_24px_rgba(239,68,68,0.7)]' : ''}`} />
    </div>
  );
}

export default memo(Character);
