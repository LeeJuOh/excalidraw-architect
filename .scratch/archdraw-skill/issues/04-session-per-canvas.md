# 04: 세션별 캔버스 — `session start/end/list`, `--session`

> 02 도그푸딩(구현 뒤)의 판정이 수정 사항으로 돌아온다. 키를 매번 붙이는 게 귀찮으면 ADR-0003의 MCP 대안을 재검토한다.

**What to build:** 에이전트 세션 둘을 같은 폴더에서 동시에 열면 각자 자기 캔버스 서버와 브라우저 탭을 가진다. 스킬은 첫 턴에 `session start`를 실행해 사용자에게 URL을 알리고, 이후 모든 호출에 `--session <키>`를 붙인다. 컴팩션으로 키를 잃으면 `session list`로 복귀한다 — 같은 프로젝트에 하나면 자동, 여럿이면 탭 제목의 키를 사용자에게 묻는다. 세션은 사용자의 `session end`로만 끝나고 자동 감지는 없다. ([ADR-0003](../../../docs/adr/0003-one-canvas-server-per-session.md))

- 키는 서버가 발급한다. 호스트 세션 ID·PPID에 의존하지 않아 Claude·Codex 동일.
- 업스트림의 "머신당 서버 하나, 포트 3000, pid 파일" 전제를 세션 단위로 바꾼다. 빈 포트 탐색.
- 브라우저 탭 제목에 세션 키가 보인다.
- 기존 커맨드는 `--session` 없이 부르면 세션이 하나일 때 그 세션으로, 여럿이면 에러. (스펙에 없는 티켓 작성 시 제안 — 착수 전 확인)

**Blocked by:** 01 (플러그인 골격)

**Status:** ready-for-agent

- [ ] `session start` 두 번 → 서로 다른 포트·URL·키 두 개, 탭 두 개, 한쪽에 그린 게 다른 쪽에 안 보인다
- [ ] `session list`가 프로젝트별 살아 있는 세션을 키·URL과 함께 보여준다
- [ ] `session end <키>`로 그 서버만 내려간다
- [ ] `--session` 없는 호출은 세션 하나일 때 동작하고 여럿일 때 명확한 에러를 낸다
- [ ] SKILL.md에 첫 턴 `session start` + 컴팩션 복귀 절차가 있다
- [ ] 기존 `npm test` 통과
