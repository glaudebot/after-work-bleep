import { memo } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { pad2, splitMs } from '../lib/time';

const LABEL = { before: '출근까지', working: '퇴근까지', off: '출근까지' };

// memo: 부모가 리렌더돼도 props(target/phase)가 같으면 무시
// 매초 리렌더는 이 컴포넌트 내부에서만 발생
function Countdown({ targetMs, phase, onDone }) {
  const remaining = useCountdown(targetMs, onDone);
  const { h, m, s } = splitMs(remaining);

  return (
    <div className="text-center">
      <p className="text-sm text-gray-600">{LABEL[phase]}</p>
      {/* tabular-nums: 숫자 폭 고정 → 매초 글자 흔들림 방지 */}
      <p className="text-[2.75rem] font-bold leading-tight tabular-nums tracking-tight" aria-live="off">
        {pad2(h)}:{pad2(m)}:{pad2(s)}
      </p>
    </div>
  );
}

export default memo(Countdown);
