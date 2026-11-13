# 퇴근 후 삐-처리 (After-Work Bleep)

직장인용 앱인토스(토스 인앱) 미니앱. 출근·퇴근까지 남은 시간을 카운트다운으로 보여주고, 퇴근하면 세계 각국의 귀여운 순화 비속어(minced oaths)를 하나 뽑아 도감에 모은다. 모은 단어로 "아 우리 [XX]님 [YY] 같네" 짤을 만들어 이미지로 저장하거나 공유할 수 있다.

## 스택과 제약
- React + Tailwind CSS. 백엔드 없음.
- 비속어 DB는 `src/data/oaths.json`(정적 JSON). 유저 데이터는 LocalStorage에 저장하고, 키는 `bleep:` 접두사를 쓴다.
- 실행 환경은 토스 앱 안의 웹뷰. 모바일 세로 화면이 기준이다.
- 이미지 캡처는 `html2canvas`로 한다.

## 현재 상태
- `src/`에 MVP 컴포넌트와 로직만 있다. **아직 `package.json`, Vite·Tailwind 설정, `index.html`, `main.jsx`가 없다.** 지금은 빌드되지 않는다.
- 구조는 README.md 참고.

## 핵심 설계 (바꿀 때 주의)
- `useCountdown`: `setInterval` 대신 다음 정각 초에 맞춰 `setTimeout`을 이어 건다. 매 틱마다 `Date.now()`로 다시 계산하고, 화면이 가려지면(`visibilitychange`) 멈춘다. 매초 다시 그리는 범위는 `memo`로 감싼 `<Countdown>` 안으로만 한정한다.
- `getWorkPhase`: 출근 전(before) / 근무 중(working) / 퇴근 후(off) 상태를 계산한다. 야간 근무(퇴근 시각 < 출근 시각)도 지원한다.
- 퇴근 보상은 근무일마다 1번(`bleep:lastReward`). 아직 안 모은 단어를 먼저 주고, 등급별 가중치로 뽑는다.
- 짤 캡처 영역에는 외부 이미지를 넣지 않는다(CORS 때문에 캡처가 깨짐). 저장 순서는 Web Share(파일) → 실패하면 `<a download>`.

## 알려진 리스크
- 토스 웹뷰에서는 `navigator.share`로 파일을 넘기는 것과 `<a download>`가 막혀 있을 수 있다. 실제 기기에서 확인해야 한다. 막혀 있으면 앱인토스 SDK에서 이미지를 기기에 저장하는 API를 찾아 `src/lib/captureAndSave.js` 저장 순서 맨 앞에 넣는다.
- localStorage는 `try/catch`로 감싸서 접근한다(이미 `useLocalStorage`에 적용됨).
