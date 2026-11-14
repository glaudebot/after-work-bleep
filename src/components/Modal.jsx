import { useLayoutEffect, useRef } from 'react';
import { useTossBack } from '../lib/toss';

// 네이티브 <dialog> 모달 (M4-4). 뒤 화면 비활성화·포커스 가두기·Esc는 브라우저가 한다.
// dismiss: 바깥 탭으로 닫기. closedby를 모르는 브라우저(Safari)는 클릭 좌표로 판정한다
export default function Modal({ label, onClose, dismiss = false, className = '', children }) {
  const ref = useRef(null);
  useTossBack(onClose);
  // layout effect: DOM에서 빠지기 전에 close()해야 포커스가 연 버튼으로 돌아간다
  useLayoutEffect(() => {
    const d = ref.current;
    d.showModal();
    d.focus(); // 첫 버튼 대신 창 자체에 포커스: 탭 없이 열리는 보상 창에서 버튼에 포커스 테두리가 생기지 않게
    return () => d.close();
  }, []);

  const onClick = dismiss && !('closedBy' in HTMLDialogElement.prototype)
    ? (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.currentTarget.close();
      }
    : undefined;

  return (
    <dialog ref={ref} tabIndex={-1} aria-label={label} closedby={dismiss ? 'any' : undefined} onClick={onClick}
      // StrictMode가 effect를 두 번 돌리면 첫 close()의 이벤트가 다시 열린 뒤에 온다: 열려 있으면 무시
      onClose={(e) => { if (!e.currentTarget.open) onClose(); }}
      className={`bg-white outline-none ${className}`}>
      {children}
    </dialog>
  );
}

// 아래에서 올라오는 시트 모양
export const SHEET = 'mx-0 mb-0 mt-auto w-full max-w-none rounded-t-3xl backdrop:bg-black/40';
