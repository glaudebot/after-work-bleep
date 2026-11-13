# 퇴근 후 삐-처리 (After-Work Bleep)

출근·퇴근 카운트다운을 보여주고, 퇴근하면 귀여운 순화 비속어를 뽑아 도감에 모으고 짤로 만드는 앱인토스(토스 인앱) 미니앱.

## 문서
| 문서 | 내용 |
|---|---|
| [docs/spec.md](docs/spec.md) | 기준 정의서 |
| [docs/MILESTONE_RULES.md](docs/MILESTONE_RULES.md) | 작업 방식 전체 (진행 순서, 문서 구조, 템플릿) |
| [MILESTONES.md](MILESTONES.md) | 마일스톤 색인 (3단계에서 만듦) |
| [docs/decisions.md](docs/decisions.md) | 설계 결정 (D-번호) |
| [docs/qa/QA_CHECKLIST.md](docs/qa/QA_CHECKLIST.md) | 마감 때 돌리는 점검 항목 |
| [STACK.md](STACK.md) | 스택·버전과 변경 이력 |
| [TODO.md](TODO.md) | 꼭지점에 안 들어간 요청·보류 |
| [docs/APPS_IN_TOSS_DOCS.md](docs/APPS_IN_TOSS_DOCS.md) | 앱인토스 문서 읽는 순서 (llms.txt → .md → 설치된 SDK) |

## 구조·스택
- React 19 + Tailwind CSS v3.4 + Vite, 캡처는 html2canvas. 백엔드 없음 (D-01, D-02).
- 단어 DB는 `src/data/oaths.json`, 유저 데이터는 localStorage `bleep:` 접두사.
- 토스 웹뷰, 모바일 세로 375px 기준.
- 파일 구조는 [README.md](README.md), 핵심 설계는 [decisions.md](docs/decisions.md) D-08, D-09, D-14, D-15.

## 실행
```
npm install
npm run dev      # 개발 서버
npm test         # node:test
npm run build    # 빌드 (타입 검사 없음: JS 프로젝트)
npm run qa       # QA T-01~T-12 자동 실행 (Playwright 브라우저 필요)
```

## 작업 규칙
- 개발은 꼭지점 단위. 꼭지점 문서 하나만 읽고 작업한다.
- 착수 전에 "정할 것"을 선택지 + 추천안(이유)으로 묻는다. 답을 받으면 "정해진 것"으로 옮기고(날짜), 필요하면 D-번호를 추가한다.
- 새 화면·기능은 화면 구성을 글로 정리해 확인받는다. 목업은 요청할 때만.
- 꼭지점이 크면 "단계" 표로 나눠 한 단계씩 진행하고 확인받는다.
- 항목을 끝낼 때마다 체크리스트를 갱신한다.
- 꼭지점 끝: 테스트 + 빌드 → 꼭지점 ✅ → 마일스톤 색인 갱신 → 커밋 → `/compact` 권장.
- 다음 마일스톤을 시작할 때는 꼭지점 문서들을 먼저 만들고 목록을 승인받는다.
- 마일스톤에 안 들어간 요청·보류·QA 지적은 TODO.md에, 반영하면 지운다.
- 스택이 바뀌면 그 자리에서 STACK.md와 꼭지점 Stack 항목에 적는다.
- 작은 판단은 가장 단순한 방식으로 정하고 꼭지점 문서에 기록. 큰 설계 판단은 멈추고 묻는다.
- 사용자가 **AR**(as Recommendation)이라고 하면 추천안대로 진행한다 (2026-11-13 사용자).
- D-08, D-09, D-14, D-15(핵심 설계)를 바꿀 때는 먼저 묻는다.
- 앱인토스 문서는 [APPS_IN_TOSS_DOCS.md](docs/APPS_IN_TOSS_DOCS.md) 순서로 필요한 부분만 읽고, 알아낸 제약은 출처와 함께 꼭지점 문서에 적는다.
