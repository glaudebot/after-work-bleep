# 스택

| 구분 | 이름 | 버전 | 비고 |
|---|---|---|---|
| 런타임 | Node.js | 22 | 개발·빌드 |
| 화면 | React, React DOM | 19.3.1 | |
| 스타일 | Tailwind CSS | 3.4.19 | v4 금지: `oklch()` 색을 html2canvas가 못 읽음 (D-01) |
| 스타일 | PostCSS, autoprefixer | 8.5.32, 10.6.2 | |
| 빌드 | Vite, @vitejs/plugin-react | 8.3.8, 6.3.0 | |
| 캡처 | html2canvas | 1.4.1 | |
| 토스 | @apps-in-toss/web-framework (cli 포함) | 3.10.0 | 3.0.x 금지: localStorage origin이 바뀜. `ait build`로 `.ait` 생성 |
| 테스트 | node:test | Node 내장 | `npm test` |
| QA | playwright | 1.63.0 | `npm run qa` (scripts/qa.cjs), 결과 이미지는 `qa-out/` |

## 설정
- `src/index.css`: Tailwind preflight의 `img{display:block}`을 `inline-block`으로 되돌린다. 그대로 두면 html2canvas 캡처에서 글자가 아래로 밀린다.
- `apps-in-toss.config.ts`: `appName: 'afterworkbleep'`, 토스 바 뒤로가기, `webBundleDir: 'dist'`.
- `package.json` `build`: `vite build && ait build` → 루트에 `afterworkbleep.ait` (gitignore).
- `index.html` viewport: 핀치 줌 막기 (`maximum-scale=1, user-scalable=no`), 비게임 체크리스트.
- 환경변수 없음.

## 변경 이력
> 2026-11-13: 앱인토스 SDK `@apps-in-toss/web-framework` 3.10.0, `apps-in-toss.config.ts`, build에 `ait build` 추가 (M4-2).
> 2026-11-13: QA 자동화용 playwright 1.63.0 devDependency 추가 (M1-3).
> 2026-11-13: Vite + React + Tailwind v3.4 + html2canvas 설정 추가. Tailwind v4는 캡처 실패로 v3.4로 고정.
