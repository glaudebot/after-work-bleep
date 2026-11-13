# 앱인토스 문서 읽는 법

> 지시: 2026-11-13 사용자. HTML을 통째로 읽지 말고 필요한 부분만 읽는다.

1. **문서 목록:** AI용 목록에서 주제어로 페이지 주소를 찾는다.
   ```
   curl -sS -m 20 https://developers-apps-in-toss.toss.im/llms.txt -o llms.txt
   grep -iE "주제어|광고|인증|auth|console" llms.txt
   ```
2. **페이지는 마크다운 원문:** 주소 끝에 `.md`를 붙인다. 길면 필요한 줄만 본다.
   ```
   curl -sS https://developers-apps-in-toss.toss.im/guide/authentication/anonymous-key-auth-code.md | sed -n '1,80p' | cut -c1-300
   ... | grep -n -A5 "키워드"
   ```
3. **API는 설치된 SDK로 최종 확인:** 문서와 SDK가 다를 수 있다.
   - `node_modules/@apps-in-toss/web-framework/dist/index.d.ts` (함수 이름·인자·반환 타입)
   - `node_modules/@apps-in-toss/web-framework/package.json` (버전)
   - `node_modules/@apps-in-toss/cli/dist/index.js` (`ait build` 동작)
4. **그 밖의 자료:** 웹 페이지 읽기 도구로.
   - 업데이트 소식: toss.im/apps-in-toss/blog/...
   - 커뮤니티 질문과 답: techchat-apps-in-toss.toss.im
   - 검수 체크리스트: developers-apps-in-toss.toss.im 의 checklist 페이지 (게임·비게임 따로, 이 앱은 비게임)
5. **정리:** 알아낸 규칙·제약은 출처 주소와 함께 꼭지점 문서나 TODO.md에 짧게 적는다.

## 환경 메모
- 2026-11-13: 이 클라우드 세션에서는 `developers-apps-in-toss.toss.im` 접속이 네트워크 정책으로 막혀 있다 (프록시 403). M4 시작 때 허용 호스트를 추가해야 한다.
