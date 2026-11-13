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
 * @returns 'shared' | 'downloaded' | 'cancelled'
 */
export async function captureAndShare(node, { filename = 'bleep.png', title = '퇴근 후 삐-처리' } = {}) {
  const blob = await captureNode(node);
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
