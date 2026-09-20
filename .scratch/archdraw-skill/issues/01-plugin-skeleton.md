# 01: 플러그인 골격 — npm 게시, 매니페스트 생성, shim, 최소 SKILL.md

**What to build:** 빌드 산출물이 없는 새 PC에서 사용자가 이 레포의 스킬을 설치하고 호스트별 표기로 `archdraw`를 부르면, 캔버스 서버가 뜨고 브라우저에 캔버스가 열리고 박스 하나가 그려진다. 설치 채널은 Claude Code 플러그인, Codex 플러그인, `npx skills add <레포>` 셋이고 모두 같은 스킬 폴더를 받는다. 스킬은 호스트에 archdraw MCP 툴이 보이면 그것을 부르고, MCP 등록이 없는 `npx skills add` 채널에서는 스킬 폴더 shim으로 CLI를 부른다. 서버는 어느 경로든 shim이 npm 게시본에서 받는다. 이 티켓은 판단 규칙을 담지 않는다 — 이후 모든 티켓이 올라탈 관통선만 낸다.

- 서버는 npm 패키지 `excalidraw-architect`로 게시한다. `package.json`의 `name`·`bin`을 바꾸고, 패키지에 `dist/bin.js`와 프론트 `dist/frontend/`가 들어가는지 확인한다. 첫 `npm publish`는 사람이 npm 계정으로 한다 — 에이전트는 `npm pack` 확인까지. (스펙 §7-5a, [ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md))
- 스킬은 MCP 툴 우선, CLI 폴백([ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md) 2026-09-20 개정). SKILL.md는 "archdraw MCP 툴이 있으면 그것을, 없으면 아래 shim"이라고 적고 두 경로의 대응(툴 이름 ↔ 커맨드)은 `references/canvas-ops.md`가 갖는다(03). CLI 호출 줄은 스킬 루트 기준 상대경로 하나이며 `${CLAUDE_PLUGIN_ROOT}` 같은 호스트 변수를 쓰지 않는다. shim은 `ARCHDRAW_BIN`이 있으면 그 로컬 빌드를, 없으면 `npx -y excalidraw-architect@<고정 버전>`을 실행한다.
- 매니페스트 5개(Claude 플러그인·마켓플레이스·MCP, Codex 플러그인·MCP)와 shim의 고정 버전은 손으로 쓰지 않고 `package.json`을 단일 소스로 생성 스크립트가 만든다. MCP 매니페스트는 npx를 직접 부르지 않고 shim을 인자 없이 실행한다 — command는 셸, args는 호스트 변수로 가리킨 shim 경로(Claude `${CLAUDE_PLUGIN_ROOT}`, Codex `${PLUGIN_ROOT}`; 매니페스트 args는 두 호스트 모두 치환). bin은 인자가 없으면 MCP stdio 모드라 `mcp` 서브커맨드는 만들지 않는다. 그래서 `ARCHDRAW_BIN`이 MCP 경로에도 적용된다. 생성물은 커밋하고, CI가 "생성물이 최신인가"를 diff로 검사한다. (스펙 §7-5b)
- SKILL.md는 첫 턴 서버 명령 전에 "캔버스 서버 준비 중, 처음이면 다운로드로 오래 걸림"을 한 줄 알리고, 실패하면 원인(인터넷·Codex 권한)으로 옮겨 알린다. README에 설치 채널 셋과 "첫 실행에 인터넷 필요"를 적는다.
- 수동 호출 정책은 스펙 "수동 스킬"(검수 R11)을 따른다. 공통 `skills/archdraw/SKILL.md`에 Claude용 `disable-model-invocation: true`, 같은 스킬 폴더의 `agents/openai.yaml`에 Codex용 `policy.allow_implicit_invocation: false`를 넣어 세 채널에 함께 배포한다. README·스킬 사용 안내에 Claude 플러그인의 `/excalidraw-architect:archdraw`(충돌 없으면 `/archdraw`)와 Codex CLI/IDE의 `$archdraw`(또는 `/skills` 선택), ChatGPT 데스크톱 Codex의 `@excalidraw-architect` 플러그인 선택을 구분해 적는다(2026-09-20 문서 확인: 공식 문서는 `$<skill-name>`만 있고 플러그인 접두 형식은 없다. openai/codex#39166에서 플러그인 스킬을 `$<skill-name>`으로 CLI 호출 확인, 데스크톱은 `@플러그인명`). 기존 설치 확인 때 실제 표시가 다르면 안내를 고친다. 별도 자동 호출 차단 실행 시험은 추가하지 않으며, 후속 대화의 그림 우선 적용은 02 도그푸딩이 확인한다.
- 캔버스 스크린샷 png는 레포가 아니라 데이터 폴더(`$CLAUDE_PLUGIN_DATA`, Codex `$PLUGIN_DATA`, 둘 다 없으면 홈 아래) `tmp/`에 떨어진다. (스펙 §7-5c)
- 업스트림 `excalidraw-skill`은 이 티켓에서 건드리지 않는다. 새 `archdraw` 스킬을 옆에 둔다. 교체는 03.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] `npm pack` 결과물에 `dist/bin.js`와 `dist/frontend/index.html`이 들어 있다
- [x] `npm run manifests` 한 번으로 매니페스트 5개와 shim 버전이 생성되고, 버전은 `package.json` 한 곳만 바꾸면 전부 따라온다
- [x] CI에서 생성물이 스크립트 출력과 다르면 실패한다
- [ ] `dist/`가 없고 `ARCHDRAW_BIN`이 비어 있는 환경에서, 세 채널(Claude 플러그인 / Codex 플러그인 / `npx skills add`) 각각 공통 SKILL.md와 Codex 설정 파일을 함께 설치 → 호스트별 표기로 `archdraw`에 "박스 하나 그려줘" 요청 → 브라우저 캔버스에 박스가 보인다. 플러그인 두 채널은 MCP 툴 호출로, `npx skills add`는 CLI 폴백으로 그려졌음을 호스트 로그로 확인한다. 이 과정에서 공통 파일의 로딩 호환성과 Codex에 표시된 호출 식별자를 확인하고 사용 안내에 반영한다
- [ ] MCP 툴이 있는 세션에서 스킬이 Bash로 shim을 부르지 않고, MCP 툴이 없는 세션에서는 shim으로 넘어간다
- [ ] Codex에서 SKILL.md의 호출 줄이 치환 없이 그대로 동작한다
- [ ] npx 캐시가 비고 인터넷이 끊긴 상태에서 첫 호출 시, 에이전트가 서버를 받지 못한 원인을 사용자에게 알린다
- [ ] `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트를 시작하면 MCP 경로와 CLI 폴백 모두 npm 게시본 대신 로컬 빌드가 뜬다
- [ ] `screenshot` 결과 png가 레포 안이 아니라 데이터 폴더 `tmp/`에 생긴다
- [x] 기존 `npm test`가 그대로 통과한다

## Comments

**2026-09-21 — 구현 완료(에이전트), 남은 인수는 사람 몫**

만든 것:
- `package.json` name `excalidraw-architect`, bin `excalidraw-architect`/`excalidraw-canvas`, repository·homepage·bugs를 포크 레포로, author는 사용자 지정(LeeJuOh/xop4p@naver.com). CLI 도움말·`spawn` 에러 문구의 구 bin 이름도 새 이름으로.
- `scripts/generate-manifests.mjs` — `package.json` 단일 소스로 매니페스트 5개(`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json`, 루트 `plugin.json`, `mcp.json`)와 shim(`skills/archdraw/scripts/archdraw`, 0755) 생성. `npm run manifests` / `--check`(=`npm run test:manifests`, `npm test`·CI에 포함). 드리프트와 실행 권한 유실 모두 exit 1 확인.
- `skills/archdraw/` — 최소 SKILL.md(MCP 우선·shim 폴백, 첫 턴 준비 안내 한 줄, 실패 원인 구분, `disable-model-invocation: true`), `agents/openai.yaml`(`allow_implicit_invocation: false`). 판단 규칙 없음 — 03 몫.
- `src/core/data-dir.ts` + `scripts/check-data-dir.mjs` — `CLAUDE_PLUGIN_DATA` → `PLUGIN_DATA` → `~/.excalidraw-architect` 순, `tmp/` 생성. CLI `screenshot`의 기본 출력이 `os.tmpdir()`에서 이 폴더로 이동.
- `scripts/check-pack-contents.mjs`(CI) — 타르볼에 `dist/bin.js`·`dist/frontend/index.html`·스킬 파일이 들어 있는지.
- README/README.ko에 설치 채널 셋·수동 호출 표기·"첫 실행 인터넷 필요"·`ARCHDRAW_BIN` 절.
- `npm-publish.yml`의 하드코딩된 구 패키지 이름을 `package.json`에서 읽도록.

로컬 확인: `npm test`·`npm run type-check` 통과. `npm pack --dry-run`에 필요한 경로 7개 모두 존재. `ARCHDRAW_BIN`을 둔 셸에서 shim을 **직접** 실행하면 CLI(`--version` → 2.0.0)와 MCP(무인자 `initialize` 응답) 양쪽 다 로컬 빌드로 떴다. 다만 인수 기준은 "호스트를 시작하면"이라 호스트가 MCP 자식 프로세스에 환경을 물려주는지까지는 확인 못 했다 — 그래서 해당 항목은 체크하지 않았다.

남은 인수 항목(사람): 세 채널 실제 설치 후 "박스 하나" 요청, MCP 있음/없음에 따른 경로 선택, Codex에서 SKILL.md 호출 줄 동작, 오프라인 첫 호출 안내, 브라우저 열고 찍은 `screenshot` png 위치. 이 과정에서 확인된 설치 명령·호출 식별자로 README 표를 고칠 것.

검수 반영(같은 날): 패키지 이름을 `src/core/version.ts`의 `packageName()` 한 곳에서 읽도록(도움말·에러 문구 6곳의 리터럴 제거), 매니페스트 생성기의 중복 블록 합치기, `AGENTS.md` 현 단계·생성물 gotcha 갱신, 호스트가 치환하지 않은 `${...}` 리터럴을 데이터 폴더로 쓰지 않는 가드.

**티켓과 달라졌다가 되돌린 것:** Claude `.mcp.json`에 `env: {CLAUDE_PLUGIN_DATA: "${CLAUDE_PLUGIN_DATA}"}`를 한 번 넣었다가 뺐다. 7-5b는 command·args만 정하고, MCP `get_canvas_screenshot`은 png를 인라인으로 돌려주므로 MCP 경로는 데이터 폴더를 쓰지 않는다. MCP 경로에서 파일을 쓰게 되는 06에서 다시 판단할 것.

결정이 필요한 남은 사항:
1. `npm publish`는 사람이 해야 한다(티켓 명시). 게시 전까지 shim의 `excalidraw-architect@2.0.0`은 npm에 없으므로 `ARCHDRAW_BIN` 없이는 어떤 채널도 서버를 못 받는다.
2. MCP `serverInfo.name`은 아직 `mcp-excalidraw-server`(업스트림 값). 패키지만 개명했다. 바꾸면 `scripts/check-mcp-stdio.mjs`의 단언 2줄도 같이 바꾼다 — 티켓에 없어 건드리지 않았다.
3. Codex `codex plugin marketplace add`용 카탈로그(`.agents/plugins/marketplace.json`)는 티켓의 매니페스트 5개에 없어 만들지 않았다. 공식 문서상 카탈로그 없이도 플러그인 폴더 설치는 가능하다.
4. 업스트림 `skills/excalidraw-skill/`은 티켓 지시대로 그대로 뒀다. 그 스킬은 수동 전용 설정이 없어 자동 호출 대상이고 구 npm 패키지를 안내한다 — 03에서 삭제된다.
