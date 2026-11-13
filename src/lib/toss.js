import { useEffect, useRef } from 'react';
import { graniteEvent } from '@apps-in-toss/web-framework';

// SDK는 토스 웹뷰(ReactNativeWebView)가 아니면 throw한다. 브라우저에서는 SDK를 부르지 않는다.
export const inToss = typeof window !== 'undefined' && window.ReactNativeWebView != null;

// 열린 화면 위에서부터 뒤로가기를 받는다. 쌓인 게 없으면 구독을 풀어 토스 기본 동작(미니앱 종료)에 맡긴다 (M4-2)
const stack = [];
let unsubscribe = null;

export function useTossBack(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!inToss) return;
    stack.push(ref);
    if (!unsubscribe) {
      try {
        unsubscribe = graniteEvent.addEventListener('backEvent', { onEvent: () => stack.at(-1)?.current() });
      } catch (e) {
        console.error(e);
      }
    }
    return () => {
      stack.splice(stack.indexOf(ref), 1);
      if (!stack.length && unsubscribe) { unsubscribe(); unsubscribe = null; }
    };
  }, []);
}
