# 01: 플러그인 골격 — npm 게시, 매니페스트 생성, shim, 최소 SKILL.md

**What to build:** 빌드 산출물이 없는 새 PC에서 사용자가 이 레포의 스킬을 설치하고 호스트별 표기로 `archdraw`를 부르면, 캔버스 서버가 뜨고 브라우저에 캔버스가 열리고 박스 하나가 그려진다. 설치 채널은 Claude Code 플러그인, Codex 플러그인, `npx skills add <레포>` 셋이고 모두 같은 스킬 폴더를 받는다. 스킬은 호스트에 archdraw MCP 툴이 보이면 그것을 부르고, MCP 등록이 없는 `npx skills add` 채널에서는 스킬 폴더 shim으로 CLI를 부른다. 서버는 어느 경로든 shim이 npm 게시본에서 받는다. 이 티켓은 판단 규칙을 담지 않는다 — 이후 모든 티켓이 올라탈 관통선만 낸다.

- 서버는 npm 패키지 `excalidraw-architect`로 게시한다. `package.json`의 `name`·`bin`을 바꾸고, 패키지에 `dist/bin.js`와 프론트 `dist/frontend/`가 들어가는지 확인한다. 첫 `npm publish`는 사람이 npm 계정으로 한다 — 에이전트는 `npm pack` 확인까지. (스펙 §7-5a, [ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md))
- 스킬은 MCP 툴 우선, CLI 폴백([ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md) 2026-09-20 개정). SKILL.md는 "archdraw MCP 툴이 있으면 그것을, 없으면 아래 shim"이라고 적고 두 경로의 대응(툴 이름 ↔ 커맨드)은 `references/canvas-ops.md`가 갖는다(03). CLI 호출 줄은 스킬 루트 기준 상대경로 하나이며 `${CLAUDE_PLUGIN_ROOT}` 같은 호스트 변수를 쓰지 않는다. shim은 `ARCHDRAW_BIN`이 있으면 그 로컬 빌드를, 없으면 `npx -y excalidraw-architect@<고정 버전>`을 실행한다.
- 매니페스트 5개(Claude 플러그인·마켓플레이스·MCP, Codex 플러그인·MCP)와 shim의 고정 버전은 손으로 쓰지 않고 `package.json`을 단일 소스로 생성 스크립트가 만든다. MCP 매니페스트는 npx를 직접 부르지 않고 shim을 인자 없이 실행한다 — command는 셸, args는 호스트 변수로 가리킨 shim 경로(Claude `${CLAUDE_PLUGIN_ROOT}`, Codex `${PLUGIN_ROOT}`; 매니페스트 args는 두 호스트 모두 치환). bin은 인자가 없으면 MCP stdio 모드라 `mcp` 서브커맨드는 만들지 않는다. 그래서 `ARCHDRAW_BIN`이 MCP 경로에도 적용된다. 생성물은 커밋하고, CI가 "생성물이 최신인가"를 diff로 검사한다. (스펙 §7-5b)
- SKILL.md는 첫 턴 서버 명령 전에 "캔버스 서버 준비 중, 처음이면 다운로드로 오래 걸림"을 한 줄 알리고, 실패하면 원인(인터넷·Codex 권한)으로 옮겨 알린다. README에 설치 채널 셋과 "첫 실행에 인터넷 필요"를 적는다.
- 수동 호출 정책은 스펙 "수동 스킬"(검수 R11)을 따른다. 공통 `skills/archdraw/SKILL.md`에 Claude용 `disable-model-invocation: true`, 같은 스킬 폴더의 `agents/openai.yaml`에 Codex용 `policy.allow_implicit_invocation: false`를 넣어 세 채널에 함께 배포한다. README·스킬 사용 안내에 Claude 플러그인의 `/excalidraw-architect:archdraw`(충돌 없으면 `/archdraw`)와 Codex의 `/skills` 선택·`$` 스킬 선택을 구분해 적는다. Codex 플러그인의 정확한 식별자는 기존 설치 확인 때 확인해 안내에 적는다. 별도 자동 호출 차단 실행 시험은 추가하지 않으며, 후속 대화의 그림 우선 적용은 02 도그푸딩이 확인한다.
- 캔버스 스크린샷 png는 레포가 아니라 데이터 폴더(`$CLAUDE_PLUGIN_DATA`, Codex `$PLUGIN_DATA`, 둘 다 없으면 홈 아래) `tmp/`에 떨어진다. (스펙 §7-5c)
- 업스트림 `excalidraw-skill`은 이 티켓에서 건드리지 않는다. 새 `archdraw` 스킬을 옆에 둔다. 교체는 03.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npm pack` 결과물에 `dist/bin.js`와 `dist/frontend/index.html`이 들어 있다
- [ ] `npm run manifests` 한 번으로 매니페스트 5개와 shim 버전이 생성되고, 버전은 `package.json` 한 곳만 바꾸면 전부 따라온다
- [ ] CI에서 생성물이 스크립트 출력과 다르면 실패한다
- [ ] `dist/`가 없고 `ARCHDRAW_BIN`이 비어 있는 환경에서, 세 채널(Claude 플러그인 / Codex 플러그인 / `npx skills add`) 각각 공통 SKILL.md와 Codex 설정 파일을 함께 설치 → 호스트별 표기로 `archdraw`에 "박스 하나 그려줘" 요청 → 브라우저 캔버스에 박스가 보인다. 플러그인 두 채널은 MCP 툴 호출로, `npx skills add`는 CLI 폴백으로 그려졌음을 호스트 로그로 확인한다. 이 과정에서 공통 파일의 로딩 호환성과 Codex에 표시된 호출 식별자를 확인하고 사용 안내에 반영한다
- [ ] MCP 툴이 있는 세션에서 스킬이 Bash로 shim을 부르지 않고, MCP 툴이 없는 세션에서는 shim으로 넘어간다
- [ ] Codex에서 SKILL.md의 호출 줄이 치환 없이 그대로 동작한다
- [ ] npx 캐시가 비고 인터넷이 끊긴 상태에서 첫 호출 시, 에이전트가 서버를 받지 못한 원인을 사용자에게 알린다
- [ ] `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트를 시작하면 MCP 경로와 CLI 폴백 모두 npm 게시본 대신 로컬 빌드가 뜬다
- [ ] `screenshot` 결과 png가 레포 안이 아니라 데이터 폴더 `tmp/`에 생긴다
- [ ] 기존 `npm test`가 그대로 통과한다
