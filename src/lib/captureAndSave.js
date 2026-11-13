import { File as TossFile } from '@apps-in-toss/web-framework';
import { inToss } from './toss';

// 첫 번들에서 빼고 짤 화면이 열릴 때 미리 받는다 (M1-2). 실패하면 다음 호출에서 다시 받는다.
let lib;
export const preloadCapture = () =>
  (lib ??= import('html2canvas').then((m) => m.default, (e) => { lib = null; throw e; }));

/** DOM 노드 → PNG Blob */
export async function captureNode(node) {
  // 웹폰트가 로드되기 전에 캡처하면 글꼴이 깨지므로 대기
  if (document.fonts?.ready) await document.fonts.ready;

  const html2canvas = await preloadCapture();
  const canvas = await html2canvas(node, {
    scale: Math.min(window.devicePixelRatio || 2, 3), // 선명도 vs 메모리 균형
    backgroundColor: null,  // 노드의 배경색 그대로
    useCORS: true,          // 외부 이미지 사용 시 필요 (서버 CORS 헤더도 필요)
    logging: false,
  });

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob 실패'))), 'image/png')
  );
}

/** <a download> 폴백 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 캡처 → 공유 시트(갤러리 저장 포함) → 실패 시 다운로드
 * @returns 'saved' | 'shared' | 'downloaded' | 'cancelled'
 */
export async function captureAndShare(node, { filename = 'bleep.png', title = '퇴근 후 삐-처리' } = {}) {
  const blob = await captureNode(node);

  // 0순위: 토스 웹뷰는 공유·다운로드가 조용히 무시되므로 SDK로 기기에 저장 (D-14 대안, 2026-11-13 사용자 실기기 확인)
  if (inToss && TossFile.saveBase64.isSupported()) {
    const data = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]); // data:...;base64, 접두사 제거
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
    await TossFile.saveBase64({ data, fileName: filename, mimeType: 'image/png' });
    return 'saved';
  }
  const file = new File([blob], filename, { type: 'image/png' });

  // 1순위: Web Share API (iOS/Android 공유 시트에 "이미지 저장" 포함)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'; // 사용자가 닫음
      // 그 외 에러는 폴백으로 진행
    }
  }

  // 2순위: 다운로드
  downloadBlob(blob, filename);
  return 'downloaded';
}
