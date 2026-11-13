import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'afterworkbleep', // 콘솔에 등록한 이름과 같아야 업로드된다 (M4-2, 2026-11-13 사용자)
  navigationBar: { withBackButton: true }, // 뒤로가기는 토스 바만 쓴다 (M4-2)
  webView: {},
  permissions: [],
  webBundleDir: 'dist',
});
