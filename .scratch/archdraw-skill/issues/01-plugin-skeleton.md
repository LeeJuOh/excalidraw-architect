# 01: 플러그인 골격 — npm 게시, 매니페스트 생성, shim, 최소 SKILL.md

**What to build:** 빌드 산출물이 없는 새 PC에서 사용자가 이 레포의 스킬을 설치하고 `/archdraw`를 부르면, 캔버스 서버가 뜨고 브라우저에 캔버스가 열리고 박스 하나가 그려진다. 설치 채널은 Claude Code 플러그인, Codex 플러그인, `npx skills add <레포>` 셋이고 모두 같은 스킬 폴더를 받는다. 서버는 shim이 npm 게시본에서 받는다. 이 티켓은 판단 규칙을 담지 않는다 — 이후 모든 티켓이 올라탈 관통선만 낸다.

- 서버는 npm 패키지 `excalidraw-architect`로 게시한다. `package.json`의 `name`·`bin`을 바꾸고, 패키지에 `dist/bin.js`와 프론트 `dist/frontend/`가 들어가는지 확인한다. 첫 `npm publish`는 사람이 npm 계정으로 한다 — 에이전트는 `npm pack` 확인까지. (스펙 §7-5a, [ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md))
- 스킬은 스킬 폴더 안 shim으로 CLI를 부른다. SKILL.md의 호출 줄은 스킬 루트 기준 상대경로 하나이며 `${CLAUDE_PLUGIN_ROOT}` 같은 호스트 변수를 쓰지 않는다. shim은 `ARCHDRAW_BIN`이 있으면 그 로컬 빌드를, 없으면 `npx -y excalidraw-architect@<고정 버전>`을 실행한다.
- 매니페스트 5개(Claude 플러그인·마켓플레이스·MCP, Codex 플러그인·MCP)와 shim의 고정 버전은 손으로 쓰지 않고 `package.json`을 단일 소스로 생성 스크립트가 만든다. MCP 매니페스트도 npx로 서버를 부른다. 생성물은 커밋하고, CI가 "생성물이 최신인가"를 diff로 검사한다. (스펙 §7-5b)
- SKILL.md는 첫 턴 서버 명령 전에 "캔버스 서버 준비 중, 처음이면 다운로드로 오래 걸림"을 한 줄 알리고, 실패하면 원인(인터넷·Codex 권한)으로 옮겨 알린다. README에 설치 채널 셋과 "첫 실행에 인터넷 필요"를 적는다.
- 스킬은 수동 호출(`disable-model-invocation: true`, `/archdraw <발화>`). Codex 쪽 수동 호출 정책은 검수 R11에서 따로 다룬다.
- 캔버스 스크린샷 png는 레포가 아니라 데이터 폴더(`$CLAUDE_PLUGIN_DATA`, Codex `$PLUGIN_DATA`, 둘 다 없으면 홈 아래) `tmp/`에 떨어진다. (스펙 §7-5c)
- 업스트림 `excalidraw-skill`은 이 티켓에서 건드리지 않는다. 새 `archdraw` 스킬을 옆에 둔다. 교체는 03.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npm pack` 결과물에 `dist/bin.js`와 `dist/frontend/index.html`이 들어 있다
- [ ] `npm run manifests` 한 번으로 매니페스트 5개와 shim 버전이 생성되고, 버전은 `package.json` 한 곳만 바꾸면 전부 따라온다
- [ ] CI에서 생성물이 스크립트 출력과 다르면 실패한다
- [ ] `dist/`가 없고 `ARCHDRAW_BIN`이 비어 있는 환경에서, 세 채널(Claude 플러그인 / Codex 플러그인 / `npx skills add`) 각각 설치 → `/archdraw 박스 하나 그려줘`(Codex는 해당 호출 표기) → 브라우저 캔버스에 박스가 보인다
- [ ] Codex에서 SKILL.md의 호출 줄이 치환 없이 그대로 동작한다
- [ ] npx 캐시가 비고 인터넷이 끊긴 상태에서 첫 호출 시, 에이전트가 서버를 받지 못한 원인을 사용자에게 알린다
- [ ] `ARCHDRAW_BIN=<레포>/dist/bin.js`를 두면 npm 게시본 대신 로컬 빌드가 뜬다
- [ ] `screenshot` 결과 png가 레포 안이 아니라 데이터 폴더 `tmp/`에 생긴다
- [ ] 기존 `npm test`가 그대로 통과한다
