import { useEffect, useRef } from 'react';
import { graniteEvent, Screen } from '@apps-in-toss/web-framework';

// SDK는 토스 웹뷰(ReactNativeWebView)가 아니면 throw한다. 브라우저에서는 SDK를 부르지 않는다.
export const inToss = typeof window !== 'undefined' && window.ReactNativeWebView != null;

// 열린 화면 위에서부터 뒤로가기를 받는다. 쌓인 게 없으면(첫 화면) 미니앱을 닫는다.
// 구독을 풀어 토스 기본 동작에 맡기면 첫 화면에서 안 닫혀 심사 반려됨 (2026-11-15 심사)
const stack = [];

function onBack() {
  const top = stack.at(-1);
  if (top) top.current();
  else Screen.close().catch(console.error);
}

export function useTossBack(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!inToss) return;
    stack.push(ref);
    return () => { stack.splice(stack.indexOf(ref), 1); };
  }, []);
}

if (inToss) {
  try {
    graniteEvent.addEventListener('backEvent', { onEvent: onBack });
  } catch (e) {
    console.error(e);
  }
}
