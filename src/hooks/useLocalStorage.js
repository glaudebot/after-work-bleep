import { useEffect, useState } from 'react';

// 토스 웹뷰/시크릿 모드에서 localStorage 접근이 throw 할 수 있어 try/catch 필수
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 저장 실패는 무시 (메모리 상태로 동작) */
    }
  }, [key, value]);

  return [value, setValue];
}
