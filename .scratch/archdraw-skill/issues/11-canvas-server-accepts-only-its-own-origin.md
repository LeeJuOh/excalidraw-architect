# 11: 캔버스 서버는 자기 페이지와 에이전트의 요청만 받는다

> 2026-10-09 6a 커밋 뒤 보안 검토에서 나옴. 업스트림은 `cors()`로 모든 origin을 받는데, 공유 캔버스·원격 배포를 버린 우리 설계([ADR-0003](../../../docs/adr/0003-one-canvas-server-per-session.md))에서는 쓰는 데가 없고, 6a로 스냅샷이 디스크에 쓰이면서 열린 문의 값이 커졌다. 업스트림도 원격 인증은 없다("the API has no built-in authentication").

**What to build:** 사용자가 브라우저에 다른 사이트를 열어 두고 있어도, 그 사이트가 `localhost:<포트>`의 캔버스 서버에 HTTP나 WebSocket으로 요청을 보내면 서버가 거부한다. 캔버스 페이지, CLI, MCP는 전과 똑같이 동작한다. 사용자에게 보이는 변화는 없다.

- 규칙 하나: 요청에 `Origin` 헤더가 **없으면** 통과(CLI·MCP·curl은 브라우저가 아니라 헤더가 없다). `Origin`이 **이 서버 자신**이면 통과. 그 외는 거부한다 — HTTP는 403, WebSocket은 핸드셰이크에서 끊는다. 거부는 처리 전에 한다. CORS 응답 헤더만 좁히면 브라우저가 응답을 안 보여 줄 뿐 쓰기 요청은 서버에 도착하므로 그걸로는 부족하다.
- "이 서버 자신" = `http://<호스트>:<이 서버의 포트>`. 호스트는 `localhost`·`127.0.0.1`·`[::1]`과 실제 bind 호스트. 포트는 서버가 `listen` 뒤 OS에서 받은 값이다. 세션마다 포트가 달라도 각 서버는 자기 포트만 허용한다. 다른 세션의 캔버스 페이지도 거부 대상이다.
- HTTP API와 WebSocket 둘 다. WebSocket도 지금은 아무 origin이나 붙어 캔버스 요소 방송을 받는다.
- `npm run dev`의 vite 프록시는 넘길 때 `Origin` 헤더를 뗀다(헤더 없음 → 통과). 프론트 코드는 바꾸지 않는다 — 페이지가 자기를 준 서버를 같은 origin으로 부른다.
- 허용 origin을 바꾸는 환경변수나 플래그는 두지 않는다(ADR-0003의 방향: 캔버스 서버를 띄우고 붙는 방법은 하나).
- 미래의 원격 지원과 충돌하지 않는다. 원격이 되려면 터널과 인증이 따로 필요하고, 그때도 페이지와 API가 같은 주소에서 나오므로 "자기 자신만"으로 충분하다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**테스트 경계(합의됨):** 실제 `dist` 빌드로 띄운 캔버스 서버에 Node `fetch`·`ws`로 헤더를 바꿔 가며 요청한다. R10과 같다.

- [ ] `Origin: https://evil.example`로 `POST /api/snapshots`를 보내면 403이고 스냅샷 파일이 생기지 않는다. `GET /api/snapshots`·`GET /api/elements`도 403이다
- [ ] 같은 origin으로 WebSocket을 열면 핸드셰이크가 거부된다
- [ ] `Origin` 없이 보낸 같은 요청들은 전과 같이 성공한다(CLI·MCP 경로)
- [ ] `Origin: http://localhost:<이 서버 포트>`·`http://127.0.0.1:<포트>`는 통과한다. 다른 포트의 `localhost`는 403이다
- [ ] 실세션: 브라우저로 캔버스를 열어 그리고 Sync to Backend하면 전과 같이 동기화되고 WebSocket 방송이 온다
- [ ] 기존 `npm test`(`check-sessions`·`check-snapshots`의 MCP·CLI 경로 포함) 통과
