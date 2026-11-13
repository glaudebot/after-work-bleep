# 퇴근 후 삐-처리 (After-Work Bleep) — MVP

```
src/
├─ App.jsx                  # 상태 허브: 설정·도감·보상·화면 전환
├─ data/oaths.json          # 순화 비속어 정적 DB
├─ hooks/
│  ├─ useCountdown.js       # 초 경계 정렬 타이머 (드리프트·백그라운드 대응)
│  └─ useLocalStorage.js    # 안전한 LocalStorage 동기화
├─ lib/
│  ├─ time.js               # 근무 상태(before/working/off) 계산, 야간근무 지원
│  └─ captureAndSave.js     # html2canvas → Web Share → download 폴백
└─ components/
   ├─ Countdown.jsx         # memo, 매초 리렌더를 여기로 격리
   ├─ SettingsSheet.jsx     # 출퇴근 시간 설정
   ├─ RewardModal.jsx       # 퇴근 보상 뽑기 결과
   ├─ Collection.jsx        # 도감 그리드
   └─ MemeMaker.jsx         # 짤 편집 + 캡처 영역
```

실행 방법과 문서는 [CLAUDE.md](CLAUDE.md) 참고.
