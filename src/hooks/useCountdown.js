import { useEffect, useRef, useState } from 'react';

/**
 * 1초 단위 카운트다운 (최적화 포인트)
 * 1) setInterval 대신 "다음 초 경계"에 맞춘 setTimeout 체인
 *    → interval 누적 드리프트가 없고, 초가 바뀌는 순간 정확히 갱신
 * 2) 매 틱마다 Date.now()로 재계산 → 백그라운드에서 타이머가 멈췄다 와도 정확
 * 3) visibilitychange 시 즉시 재계산 + 숨김 상태에서는 틱 중단 (배터리 절약)
 * 4) 남은 "초"가 바뀔 때만 setState → 불필요한 리렌더 없음
 * 5) 이 훅은 <Countdown> 안에서만 사용 → 매초 리렌더가 앱 전체로 번지지 않음
 */
export function useCountdown(targetMs, onDone) {
  const calc = () => Math.max(0, targetMs - Date.now());
  const [remaining, setRemaining] = useState(calc);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let timer = null;
    let fired = false;

    const tick = () => {
      const left = calc();
      const sec = Math.ceil(left / 1000);
      setRemaining((prev) => (Math.ceil(prev / 1000) === sec ? prev : left));

      if (left <= 0) {
        if (!fired) {
          fired = true;
          onDoneRef.current?.();
        }
        return; // 종료
      }
      if (document.hidden) return; // 숨김 상태면 다음 틱 예약 안 함
      // 다음 초 경계까지 남은 ms (+5ms 여유)
      const delay = (left % 1000 || 1000) + 5;
      timer = setTimeout(tick, delay);
    };

    const onVisibility = () => {
      clearTimeout(timer);
      if (!document.hidden) tick();
    };

    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  return remaining;
}
