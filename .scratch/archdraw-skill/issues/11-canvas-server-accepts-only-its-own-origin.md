# 11: 캔버스 서버는 자기 페이지와 에이전트의 요청만 받는다

> 2026-10-09 6a 커밋 뒤 보안 검토에서 나옴. 업스트림은 `cors()`로 모든 origin을 받는데, 공유 캔버스·원격 배포를 버린 우리 설계([ADR-0003](../../../docs/adr/0003-one-canvas-server-per-session.md))에서는 쓰는 데가 없고, 6a로 스냅샷이 디스크에 쓰이면서 열린 문의 값이 커졌다. 업스트림도 원격 인증은 없다("the API has no built-in authentication").

**What to build:** 사용자가 브라우저에 다른 사이트를 열어 두고 있어도, 그 사이트는 `localhost:<포트>`의 캔버스 서버에 쓰지도, 캔버스 내용을 읽지도 못한다. HTTP와 WebSocket 둘 다. 캔버스 페이지, CLI, MCP는 전과 똑같이 동작한다. 사용자에게 보이는 변화는 없다.

- 검사는 두 개, 이 순서로, 처리 전에 한다. 거부는 HTTP 403, WebSocket은 핸드셰이크에서 끊는다. CORS 응답 헤더만 좁히면 브라우저가 응답을 안 보여 줄 뿐 쓰기 요청은 서버에 도착하므로 그걸로는 부족하다.
  1. **`Host`(어느 주소로 왔나):** 호스트 부분이 `localhost`·`127.0.0.1`·`[::1]`·실제 bind 호스트가 아니면 거부한다. DNS 리바인딩을 막는다 — 공격 사이트가 자기 도메인을 `127.0.0.1`로 돌리면 브라우저는 그 요청을 같은 출처 GET으로 보고 `Origin`을 붙이지 않는다. `Origin` 검사만으로는 통과하고, 공격 페이지가 응답(캔버스 요소·스냅샷 목록)까지 읽는다.
  2. **`Origin`(누가 보냈나):** 헤더가 **없으면** 통과(CLI·MCP·curl은 브라우저가 아니라 헤더가 없다). **이 서버 자신**이면 통과. 그 외는 거부한다(`Origin: null` 포함).
- "`Origin` 없음"이 곧 "브라우저 아님"은 아니다. 브라우저도 교차 출처 GET·HEAD에는 `Origin`을 빼기도 해서 그 요청은 통과한다. 이건 받아들인다 — GET은 상태를 바꾸지 않고, 공격 페이지는 그 응답을 읽지 못한다. GET·HEAD가 아닌 요청과 WebSocket에는 브라우저가 항상 `Origin`을 붙인다.
- "이 서버 자신" = `http://<호스트>:<이 서버의 포트>`. 호스트는 `localhost`·`127.0.0.1`·`[::1]`과 실제 bind 호스트. 포트는 서버가 `listen` 뒤 OS에서 받은 값이다. 세션마다 포트가 달라도 각 서버는 자기 포트만 허용한다. 다른 캔버스 세션의 페이지도 거부 대상이다.
- `npm run dev`의 vite 프록시는 `Origin`이 **vite 자기 페이지**(`http://<localhost|127.0.0.1|[::1]>:<vite 포트>`)일 때만 그 헤더를 떼고 넘긴다(헤더 없음 → 통과). 다른 `Origin`은 그대로 넘겨 서버가 거부하게 한다. 무조건 떼면 외부 사이트가 vite를 거쳐 보낸 요청도 "헤더 없음"으로 통과한다. 프록시가 넘기는 모든 경로에 같은 규칙. 프론트 코드는 바꾸지 않는다 — 페이지가 자기를 준 서버를 같은 origin으로 부른다.
- 허용 주소를 바꾸는 환경변수나 플래그는 두지 않는다(ADR-0003의 방향: 캔버스 서버를 띄우고 붙는 방법은 하나).
- 원격 지원은 지금 규칙과 충돌한다 — 터널의 공개 주소는 `Host`·`Origin` 허용 목록에 없다. 원격을 지원할 때는 서버에 터널 주소를 알려 주는 설정을 추가해 허용 주소를 넓힌다. 그때 위의 "플래그 없음"과 ADR-0003을 다시 결정한다. 인증은 따로 필요하다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**테스트 경계(합의됨):** 실제 `dist` 빌드로 띄운 캔버스 서버에 Node `fetch`·`ws`로 헤더를 바꿔 가며 요청한다. R10과 같다. vite 프록시 항목만 실세션으로 확인한다.

- [ ] `Origin: https://evil.example`로 `POST /api/snapshots`를 보내면 403이고 스냅샷 파일이 생기지 않는다. `GET /api/snapshots`·`GET /api/elements`도 403이다
- [ ] `Origin: https://evil.example`로 WebSocket을 열면 핸드셰이크가 거부된다
- [ ] `Origin: null`로 보낸 `POST /api/snapshots`는 403이다
- [ ] `Origin` 없이 보낸 같은 요청들은 전과 같이 성공한다(CLI·MCP 경로)
- [ ] `Origin: http://localhost:<이 서버 포트>`·`http://127.0.0.1:<포트>`·`http://[::1]:<포트>`·`http://<bind 호스트>:<포트>`는 통과한다
- [ ] 다른 포트의 `localhost`를 `Origin`으로 보내면 HTTP는 403, WebSocket은 핸드셰이크가 거부된다(다른 캔버스 세션)
- [ ] `Origin` 없이 `Host: evil.example:<포트>`로 보낸 `GET /api/elements`는 403이다(DNS 리바인딩)
- [ ] 실세션: 브라우저로 캔버스를 열어 그리고 Sync to Backend하면 전과 같이 동기화되고 WebSocket 방송이 온다
- [ ] 실세션(`npm run dev`): vite 페이지에서 동기화가 전과 같이 된다. `Origin: https://evil.example`로 vite 포트의 `/api/snapshots`에 POST하면 403이다
- [ ] 기존 `npm test`(`check-sessions`·`check-snapshots`의 MCP·CLI 경로 포함) 통과

## 핸드오프 — 착수 전 검수 끝, 구현 대기 (2026-10-09)

### Goal

이 티켓을 구현·리뷰·커밋한다. 그다음 [06](06-snapshot-and-export-persistence.md) 슬라이스 6b로 간다(`spec.md` "구현 이슈와 진행 순서" 8번). 커밋은 사용자 승인 뒤. 티켓에 없는 결정이 필요하면 멈추고 묻는다.

### First Action

**vite 프록시가 지금 살아 있는 경로인지 먼저 확인하고, 사용자에게 한 질문으로 묻는다.** `vite.config.js`의 프록시 대상은 `127.0.0.1:3000`인데, `npm run dev`의 `dev:server`는 `npx tsc --watch`라 캔버스 서버를 띄우지 않는다. 서버 포트 기본값도 `0`(OS가 고름, `src/server.ts`의 `PORT`)이다. 그래서 `PORT=3000`으로 따로 띄우지 않으면 프록시는 아무 데도 닿지 않는다(실행해 보지는 않음 — unverified). 죽은 경로면 "vite 프록시를 자기 페이지 `Origin`만 떼도록 고친다(본문 규칙)" 대신 "프록시를 지운다"를 선택지로 묻는다. 답을 받으면 `/tdd`로 시작한다.

### Context

- 본문 규칙은 착수 전 Codex 검수(FAIL, P1 2건)와 그릴(질문 하나씩)로 확정했다. 결과는 위 본문과 `## Comments`에 있다. 다시 따지지 않는다.
- 검수 원문 보고서는 저장하지 않았다(사용자가 끊음). 결정은 이 파일에 다 있다.
- [06 핸드오프](06-snapshot-and-export-persistence.md)는 규칙을 요약하지 않고 이 파일을 가리킨다(같은 날 고침).

### Current Progress (git 기준)

- 브랜치 `main`. 마지막 커밋 `5fdb409`(06 핸드오프 교체).
- 커밋 안 됨: 이 파일 하나(본문 개정 + 이 핸드오프). 코드 변경은 없다.
- 구현: 미착수.

### Decisions Made

- `Host` 검사 추가(DNS 리바인딩). 리바인딩된 같은 출처 GET에는 `Origin`이 없어서 `Origin` 검사만으로는 응답까지 읽힌다.
- 교차 출처 no-cors GET·HEAD가 `Origin` 없이 통과하는 것은 받아들인다. 상태를 바꾸지 않고, 공격 페이지는 응답을 못 읽는다.
- vite 프록시는 자기 페이지 `Origin`만 뗀다. 무조건 떼면 외부 사이트 요청이 vite를 거쳐 "헤더 없음"으로 통과한다. (First Action에서 프록시 삭제가 선택되면 이 줄은 바뀐다.)
- 원격은 나중에 "서버에 터널 주소를 알려 주는 설정 + ADR-0003 재결정 + 인증". 지금은 하지 않는다.
- 새 ADR과 `CONTEXT.md` 변경은 없다. 되돌리기 쉽고, 새 말은 구현 용어뿐이다.

### 구현 위치 (확인함)

- `src/server.ts`: `app.use(cors())`가 `express.json`·`express.static`보다 앞에 있다. 검사 미들웨어는 이 자리, 모든 라우트와 정적 파일보다 앞에 둔다. bind 호스트는 `HOST` 환경변수(기본 `127.0.0.1`), 실제 포트는 `server.listen` 콜백에서 얻는다.
- WebSocket: `new WebSocketServer({ server })`와 `wss.on('connection', …)`. 핸드셰이크 거부는 `verifyClient`나 `server.on('upgrade')`에서 한다. `connection` 안에서 끊으면 늦다.
- 테스트: `scripts/check-snapshots.mjs` 방식(실제 `dist`, 샌드박스 HOME, `session start --project`로 띄운 서버)으로 새 `check-origin.mjs`를 만들고 `package.json`의 `test`에 붙인다. `test:bind`(`check-local-bind.mjs`)도 bind 관련이라 참고한다.

### What Worked

- 사용자에게는 **한 번에 질문 하나**, 짧게, 추천안과 함께. 용어(vite, Host vs Origin)는 표나 흐름 4단계로 설명하면 통했다.
- "이 정책일 때 뭐가 문제냐"처럼 정책 전체를 먼저 보여 달라는 요청이 나왔다. 규칙을 바꿀 때는 **바뀐 뒤의 전체 규칙**부터 보인다.

### What Didn't Work

- ⚠️ 검수 결과를 길게 보고하면 "장황하다"고 한다. 판정 한 줄 + B(판단)/A(문구) 목록만.
- ⚠️ 용어를 설명 없이 쓰면(DNS 리바인딩, no-cors, 프록시) 사용자가 이해하지 못한다. 시나리오 한 줄로 먼저 말한다.

### Next Steps

1. First Action의 질문 답에 맞춰 본문 vite 줄과 테스트 항목을 고친다.
2. `/tdd`로 구현. 체크박스 전부 통과, `npm test` 통과.
3. `/code-review` 뒤 커밋(사용자 승인).
4. `AGENTS.md` Gotchas의 "업스트림 머지 때 되살아나면 다시 지울 것"에 `cors()`를 추가한다.
5. `Status`를 바꾸고 `spec.md` 표의 11 줄도 바꾼다. 그다음 06 슬라이스 6b.

## Comments

- 2026-10-09 착수 전 Codex 검수(FAIL, P1 2건)와 그릴링으로 고침: `Host` 검사 추가(DNS 리바인딩), vite 프록시는 자기 페이지 `Origin`만 뗌, 원격 지원 문단을 "허용 주소를 넓히는 설정 + ADR-0003 재결정 + 인증"으로 바꿈, 테스트에 WS 출처 명시·`[::1]`·bind 호스트·`Origin: null`·다른 세션 WS·`Host` 거부·vite 경유 거부 추가.
