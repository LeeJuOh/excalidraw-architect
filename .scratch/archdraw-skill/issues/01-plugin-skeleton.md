# 01: 플러그인 골격 — npm 게시, 매니페스트 생성, shim, 최소 SKILL.md

**What to build:** 빌드 산출물이 없는 새 PC에서 사용자가 이 레포의 스킬을 설치하고 호스트별 표기로 `archdraw`를 부르면, 캔버스 서버가 뜨고 브라우저에 캔버스가 열리고 박스 하나가 그려진다. 설치 채널은 Claude Code 플러그인, Codex 플러그인, `npx skills add <레포>` 셋이고 모두 같은 스킬 폴더를 받는다. 스킬은 호스트에 archdraw MCP 툴이 보이면 그것을 부르고, MCP 등록이 없는 `npx skills add` 채널에서는 스킬 폴더 shim으로 CLI를 부른다. 서버는 어느 경로든 shim이 npm 게시본에서 받는다. 이 티켓은 판단 규칙을 담지 않는다 — 이후 모든 티켓이 올라탈 관통선만 낸다.

- 서버는 npm 패키지 `excalidraw-architect`로 게시한다. `package.json`의 `name`·`bin`을 바꾸고, 패키지에 `dist/bin.js`와 프론트 `dist/frontend/`가 들어가는지 확인한다. 첫 `npm publish`는 사람이 npm 계정으로 한다 — 에이전트는 `npm pack` 확인까지. (스펙 §7-5a, [ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md)) → **2026-09-24 대체:** 로컬 `npm publish`는 없앴다. GitHub 릴리즈가 게시 워크플로를 실행해 게시한다(스펙 7-5d, 아래 슬라이스 2).
- 스킬은 MCP 툴 우선, CLI 폴백([ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md) 2026-09-20 개정). SKILL.md는 "archdraw MCP 툴이 있으면 그것을, 없으면 아래 shim"이라고 적고 두 경로의 대응(툴 이름 ↔ 커맨드)은 `references/canvas-ops.md`가 갖는다(03). CLI 호출 줄은 스킬 루트 기준 상대경로 하나이며 `${CLAUDE_PLUGIN_ROOT}` 같은 호스트 변수를 쓰지 않는다. shim은 `ARCHDRAW_BIN`이 있으면 그 로컬 빌드를, 없으면 `npx -y excalidraw-architect@<고정 버전>`을 실행한다.
- 매니페스트 5개(Claude 플러그인·마켓플레이스·MCP, Codex 플러그인·MCP)와 shim의 고정 버전은 손으로 쓰지 않고 `package.json`을 단일 소스로 생성 스크립트가 만든다. MCP 매니페스트는 npx를 직접 부르지 않고 shim을 인자 없이 실행한다 — command는 셸, args는 호스트 변수로 가리킨 shim 경로(Claude `${CLAUDE_PLUGIN_ROOT}`, Codex `${PLUGIN_ROOT}`; 매니페스트 args는 두 호스트 모두 치환). bin은 인자가 없으면 MCP stdio 모드라 `mcp` 서브커맨드는 만들지 않는다. 그래서 `ARCHDRAW_BIN`이 MCP 경로에도 적용된다. 생성물은 커밋하고, CI가 "생성물이 최신인가"를 diff로 검사한다. (스펙 §7-5b)
- SKILL.md는 첫 턴 서버 명령 전에 "캔버스 서버 준비 중, 처음이면 다운로드로 오래 걸림"을 한 줄 알리고, 실패하면 원인(인터넷·Codex 권한)으로 옮겨 알린다. README에 설치 채널 셋과 "첫 실행에 인터넷 필요"를 적는다.
- 수동 호출 정책은 스펙 "수동 스킬"(검수 R11)을 따른다. 공통 `skills/archdraw/SKILL.md`에 Claude용 `disable-model-invocation: true`, 같은 스킬 폴더의 `agents/openai.yaml`에 Codex용 `policy.allow_implicit_invocation: false`를 넣어 세 채널에 함께 배포한다. README·스킬 사용 안내에 Claude 플러그인의 `/excalidraw-architect:archdraw`(충돌 없으면 `/archdraw`)와 Codex CLI/IDE의 `$archdraw`(또는 `/skills` 선택), ChatGPT 데스크톱 Codex의 `@excalidraw-architect` 플러그인 선택을 구분해 적는다(2026-09-20 문서 확인: 공식 문서는 `$<skill-name>`만 있고 플러그인 접두 형식은 없다. openai/codex#39166에서 플러그인 스킬을 `$<skill-name>`으로 CLI 호출 확인, 데스크톱은 `@플러그인명`). 기존 설치 확인 때 실제 표시가 다르면 안내를 고친다. 별도 자동 호출 차단 실행 시험은 추가하지 않으며, 후속 대화의 그림 우선 적용은 02 도그푸딩이 확인한다.
- 캔버스 스크린샷 png는 레포가 아니라 데이터 폴더(`$CLAUDE_PLUGIN_DATA`, Codex `$PLUGIN_DATA`, 둘 다 없으면 홈 아래) `tmp/`에 떨어진다. (스펙 §7-5c) → **2026-09-24 대체:** 스크린샷 png는 OS 임시 폴더(`os.tmpdir()`)에 둔다. 데이터 폴더 `~/.excalidraw-architect/`는 호스트 변수를 읽지 않고 06 스냅샷만 쓴다([ADR-0013](../../../docs/adr/0013-data-folder-fixed-under-home.md), 아래 슬라이스 1).
- 업스트림 `excalidraw-skill`은 이 티켓에서 건드리지 않는다. 새 `archdraw` 스킬을 옆에 둔다. 교체는 03.

**Blocked by:** None (can start immediately)

**Status:** resolved (2026-09-21 — 필수 인수 전부 통과, 선택 시험 2개는 미실시로 닫음)

- [x] `npm pack` 결과물에 `dist/bin.js`와 `dist/frontend/index.html`이 들어 있다
- [x] `npm run manifests` 한 번으로 매니페스트 6개(2026-09-21 Codex 카탈로그 추가)와 shim 버전이 생성되고, 버전은 `package.json` 한 곳만 바꾸면 전부 따라온다
- [x] CI에서 생성물이 스크립트 출력과 다르면 실패한다
- [x] `dist/`가 없고 `ARCHDRAW_BIN`이 비어 있는 환경에서, 세 채널(Claude 플러그인 / Codex 플러그인 / `npx skills add`) 각각 공통 SKILL.md와 Codex 설정 파일을 함께 설치 → 호스트별 표기로 `archdraw`에 "박스 하나 그려줘" 요청 → 브라우저 캔버스에 박스가 보인다. 플러그인 두 채널은 MCP 툴 호출로, `npx skills add`는 CLI 폴백으로 그려졌음을 호스트 로그로 확인한다. 이 과정에서 공통 파일의 로딩 호환성과 Codex에 표시된 호출 식별자를 확인하고 사용 안내에 반영한다
- [x] MCP 툴이 있는 세션에서 스킬이 Bash로 shim을 부르지 않고, MCP 툴이 없는 세션에서는 shim으로 넘어간다 (2026-09-21 새 `plugin/` 레이아웃으로 Codex·Claude 플러그인 채널 MCP 경로 통과, `npx skills add` 채널 CLI 폴백 통과)
- [x] Codex에서 SKILL.md의 호출 줄이 치환 없이 그대로 동작한다 (2026-09-21 전역 `$archdraw` 호출 → `~/.agents/skills/archdraw/scripts/archdraw` CLI 실행 확인)
- [ ] npx 캐시가 비고 인터넷이 끊긴 상태에서 첫 호출 시, 에이전트가 서버를 받지 못한 원인을 사용자에게 알린다 (선택, 미실시로 닫음 — Codex 샌드박스 변형에서 원인 안내는 확인됐으나 조용한 재시도 1회로 엄격 조건 미충족. 02 도그푸딩에서 재관찰)
- [ ] `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트를 시작하면 MCP 경로와 CLI 폴백 모두 npm 게시본 대신 로컬 빌드가 뜬다 (선택·개발용, 미실시로 닫음 — shim 단독 실행은 확인됨. 서버 코드를 처음 고치는 이슈에서 확인)
- [x] `screenshot` 결과 png가 레포 안이 아니라 데이터 폴더 `tmp/`에 생긴다 (2026-09-21 Codex CLI 폴백 세션에서 `~/.excalidraw-architect/tmp/` 확인) → **2026-09-24 대체:** 기본 위치는 OS 임시 폴더(아래 슬라이스 1)
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
3. ~~Codex 카탈로그(`.agents/plugins/marketplace.json`)는 만들지 않았다. 공식 문서상 카탈로그 없이도 플러그인 폴더 설치는 가능하다.~~ **2026-09-21 정정:** 틀렸다. Codex 0.155.1에서 `~/.codex/plugins/<이름>`에 레포를 두면 `/skills`·`$archdraw` 모두 `no matches`. 카탈로그가 필수라 생성기에 6번째 매니페스트로 추가(`codexMarketplace`, source local `./`). `.gitignore`의 `.agents/` 무시에 예외 추가. 설치: `codex plugin marketplace add <레포 또는 로컬 경로>` → `codex plugin add excalidraw-architect@excalidraw-architect`. 로컬 경로로 등록·설치 확인(`installed, enabled 0.1.0`). README 표기도 이 명령으로 교체.
4. 업스트림 `skills/excalidraw-skill/`은 티켓 지시대로 그대로 뒀다. 그 스킬은 수동 전용 설정이 없어 자동 호출 대상이고 구 npm 패키지를 안내한다 — 03에서 삭제된다.

**2026-09-21 — 핸드오프(처리 완료): 사람이 정할 것 3개.** 세 질문 모두 아래에 ✅로 결정 기록됨. 최신 핸드오프는 이 파일 맨 아래.

**첫 행동:** 아래 Q1부터 한 번에 하나씩 사용자에게 묻는다(이 레포의 그릴 방식은 [검수](../review.md) "그릴 방식" 참조 — 질문 하나, 맥락 한 줄, 선택지와 추천 한 줄, 답 받은 뒤에 문서 수정). 구현 코드는 이미 커밋됐다(`d8c538c`, 작업 트리 깨끗) — 세 질문은 코드가 아니라 **게시·정체성 결정**이며, 답이 나오면 수정 범위는 `package.json` 한 곳 + 생성기 재실행이거나 서버 상수 한 곳이다.

---

**Q1 — npm 게시와 버전.** ✅ 결정 2026-09-21: **B `0.1.0`**. `package.json` version 변경 → `npm run manifests` 재실행(매니페스트 2개·shim 고정 버전 `excalidraw-architect@0.1.0` 추종). 1.0.0은 02 도그푸딩 뒤. 게시는 사람이 `npm login` → `npm run build` → `npm publish --access public`.

원문: 게시 전까지는 아무 채널도 동작하지 않는다.

- 확인된 사실: `npm view excalidraw-architect` → 404(이름 비어 있음). `package.json` version `2.0.0`, shim은 `npx -y excalidraw-architect@2.0.0`으로 고정(`skills/archdraw/scripts/archdraw`). 티켓은 첫 `npm publish`를 사람이 하라고 적었다.
- 문제: 새 npm 이름의 첫 릴리스인데 버전이 업스트림 계보를 이어받은 `2.0.0`이다. 사용자가 `npm view`로 보면 1.x가 없는 2.0.0이 보인다.
- 선택지: (A) `2.0.0` 그대로 — 포크 계보가 버전에 남고 업스트림 대조가 쉽다 / (B) `0.1.0`으로 내려 시작 — 판단 스킬이 아직 없으니 정직하고, 03~07 동안 breaking을 자유롭게 낸다 / (C) `1.0.0` — 01만으로도 설치는 완성됐다는 표시.
- 추천: B. 01은 관통선이고 라우팅 규칙이 0줄이라 지금 2.0.0은 "완성된 제품"으로 읽힌다. 02 도그푸딩 뒤에 1.0.0.
- 고르면 바뀌는 것: `package.json`의 `version` 한 줄 → `npm run manifests` → 매니페스트 3개와 shim 고정 버전이 따라온다. 그 뒤 사람이 `npm publish`.

**Q2 — MCP 서버가 자기 이름을 뭐라고 말할까.** ✅ 결정 2026-09-21: **B**. `SERVER_NAME`을 리터럴 대신 `packageName()`(package.json 단일 소스)으로, `check-mcp-stdio.mjs` 단언도 package.json에서 읽음. `scene-io.ts`의 `source`는 그대로(06 판단).

- 확인된 사실: `src/core/mcp-server.ts`의 `SERVER_NAME = 'mcp-excalidraw-server'`(업스트림 값, 미변경). `scripts/check-mcp-stdio.mjs` 131·240행이 그 값을 단언한다. `src/core/scene-io.ts`의 `source: 'mcp-excalidraw-server'`(export한 `.excalidraw` 파일에 박히는 값)도 같다. 매니페스트의 서버 키는 `archdraw`이므로 **툴 이름은 이미 archdraw 네임스페이스**로 나온다 — 이 질문은 툴 이름이 아니라 `initialize` 응답의 정체성 문자열 얘기다.
- 문제: 패키지·플러그인은 `excalidraw-architect`인데 서버는 자기를 업스트림 이름으로 소개한다. 호스트 로그·에러 메시지에서 두 이름이 섞인다.
- 선택지: (A) 그대로 둔다 — 티켓 밖이고 업스트림 머지가 쉬워진다 / (B) `excalidraw-architect`로 바꾼다 — 단언 2줄 같이 수정 / (C) `archdraw`로 바꾼다 — 매니페스트 서버 키와 일치.
- 추천: B. 패키지 정체성과 맞추는 게 최소 혼란이고, `archdraw`는 스킬 이름이라 서버 이름으로 쓰면 둘이 겹친다.
- 미결: `scene-io.ts`의 `source`는 **이미 내보낸 파일과의 호환** 문제다. 바꾸면 기존 export를 다시 읽을 때 달라지는지 06에서 확인할 일 — Q2를 B로 정해도 `source`는 따로 판단한다.

**Q3 — 게시 문구(description).** ✅ 결정 2026-09-21: **B**. 호스트 이름(Claude Code/Codex)은 빼고 형태(skill·MCP·CLI)는 꼬리로, 범위는 백엔드로 한정(03 규칙이 백엔드 기준). 확정 문구: "Discuss backend architecture in pictures with your coding agent — picks the diagram type and zoom level for the question, then draws it on a live Excalidraw canvas. Agent skill, MCP server, and CLI."

- 확인된 사실: `package.json`의 `description` = "Excalidraw toolkit for AI coding agents — agent skill, CLI, and MCP server with a live canvas"(업스트림 문구 그대로). 이 한 줄이 단일 소스라 npm과 매니페스트 5개 중 4개(`.claude-plugin/plugin.json`·`marketplace.json` 2곳·루트 `plugin.json`)에 그대로 나간다.
- 문제: 이 문구는 "그리는 손"만 설명한다. 포크의 차별점인 **판단**(무엇을 어떤 줌 레벨로 그릴지)이 안 보여서, yctimlin 패키지 옆에 놓였을 때 구분이 안 된다. README 첫 문단은 이미 판단을 앞세우고 있어 문구끼리도 어긋난다.
- 선택지: (A) 그대로 / (B) 판단을 앞세운 새 한 줄로 교체(예: 백엔드 아키텍처를 그림으로 논의하는 Claude Code/Codex 플러그인 — 질문에 맞는 그림 종류와 줌 레벨을 고른다) / (C) 03에서 스킬 본문을 쓴 뒤에 함께 정한다.
- 추천: B를 지금. 게시 전이라 무료로 바꿀 수 있고, 게시 후에 바꾸면 npm 페이지·마켓플레이스 캐시가 엇갈린다.
- 고르면 바뀌는 것: `package.json`의 `description` → `npm run manifests`.

---

이 셋과 별개로, **미완 인수 항목 6개는 전부 사람이 실제 설치해야 확인 가능**하다(위 체크박스). Q1이 정해져 게시가 끝나야 그중 5개를 시작할 수 있다.

**2026-09-21 — npm 게시 완료(사람, 계정 `leejuo`).** `excalidraw-architect@0.1.0` 게시됨. 확인(에이전트): 레포 밖 디렉터리에서 `ARCHDRAW_BIN` 없이 shim 실행 → `--version` 0.1.0, 무인자 `initialize` 응답 `serverInfo.name: excalidraw-architect`. 두 경로 모두 npm 게시본으로 뜬다. 남은 인수 항목(세 채널 설치 → 박스 하나)은 이제 시작 가능.

주의: **레포 루트 안에서** `ARCHDRAW_BIN` 없이 shim/npx를 돌리면 `sh: excalidraw-architect: command not found`. npx가 현재 디렉터리의 `package.json` 이름이 같아 로컬 패키지로 잡는데 bin이 링크돼 있지 않아서다. 게시본 검증은 레포 밖에서.

**2026-09-21 — 인수 1/3: Claude 플러그인 채널 통과.** 레포 밖 폴더에서 `/plugin marketplace add LeeJuOh/excalidraw-architect` → `/plugin install excalidraw-architect` → `/excalidraw-architect:archdraw 박스하나그려줘`. 세션 transcript로 확인: 스킬이 Bash shim 없이 **MCP 툴**(`mcp__plugin_excalidraw-architect_archdraw__batch_create_elements`)로 박스를 만들었고, 사용자가 `http://127.0.0.1:3000`을 연 뒤 `get_canvas_screenshot`이 이미지를 돌려줬다(파란 사각형 확인). 호출 표기 `/excalidraw-architect:archdraw`는 README 그대로.

- 티켓 문구 정정: "브라우저에 캔버스가 열리고"는 자동이 아니다. 업스트림도 우리 SKILL.md도 사용자에게 URL을 열어달라고 한다. 첫 스크린샷은 브라우저 열기 전이라 `No frontend client connected`로 실패했고, 연 뒤 재시도로 성공 — 설계대로. 자동 열기는 별도 결정거리(원하면 새 이슈).
- 발견: `/health`의 `service: "mcp-excalidraw-canvas"`도 업스트림 정체성 문자열. Q2 범위 밖이라 그대로 둠.
- 남은 채널: Codex 플러그인, `npx skills add`(CLI 폴백 경로).

**2026-09-21 — 인수 2/3: Codex 플러그인 채널, 1차 실패 → shim 수정.** 카탈로그로 설치 후 Codex에서 `$excalidraw-architect:archdraw 박스 하나 그려줘`(자동완성이 준 식별자. **`$archdraw`가 아니라 플러그인 접두 형식** — README 두 언어 수정). 세션 rollout·`logs_2.sqlite` 확인:
- MCP 서버 기동 실패: `MCP server stderr (sh): sh: excalidraw-architect: command not found`. Codex는 `mcp.json`의 서버를 **cwd = 플러그인 루트**(`~/.codex/plugins/cache/.../0.1.0`, 즉 레포 사본)로 띄운다. 거기 `package.json` 이름이 게시 패키지와 같아 npx가 로컬 프로젝트로 잡고 bin이 없어 죽는다. 위 "레포 밖에서 검증" 메모가 사실은 운영 버그였다. `npx -p pkg cmd` 형태도 같은 결함.
- 그래서 스킬은 설계대로 CLI 폴백으로 갔고(exec로 shim `add`), 그건 Codex 기본 샌드박스의 네트워크 차단에 걸려 출력 없음. 에이전트는 "샌드박스에서 npx를 못 받았다, 네트워크 접근 필요"라고 원인을 말했다 — 오프라인 안내 항목의 Codex 변형은 이걸로 확인.
- 수정: shim이 **인자 없음(MCP 모드)일 때 `cd /`** 후 npx 실행. 서버는 cwd를 안 읽는다. CLI 모드는 상대경로 인자 때문에 cwd 유지(레포 안에서 CLI 폴백을 돌리는 경우만 여전히 함정 — 개발자만 해당). 레포 루트 cwd에서 `initialize` 응답 확인.
- Codex 재설치(`codex plugin remove` → `add`) 후 사람이 재시험. 네트워크 차단은 Codex 승인 프롬프트나 `--sandbox danger-full-access`로.

---

**2026-09-21 — 핸드오프 2(처리 완료, 핸드오프 3으로 대체): Codex 재시험 + 플러그인 루트 분리 결정**

**Goal.** 01 인수 마무리. 남은 건 (a) Codex 플러그인 채널이 shim 수정 후 **MCP 툴 경로**로 그리는지, (b) `npx skills add` 채널의 CLI 폴백, (c) 인수 중 드러난 구조 문제 "플러그인 루트 = 레포 루트"를 어디서 고칠지 결정.

**First Action.** 사용자에게 레포 밖 폴더에서 Codex를 새로 켜고 `$excalidraw-architect:archdraw 박스 하나 더 그려줘`를 치게 한 뒤, 아래로 경로를 판정한다:
```
sqlite3 ~/.codex/logs_2.sqlite "select datetime(ts,'unixepoch','localtime'), substr(feedback_log_body,1,200) from logs where feedback_log_body like '%archdraw%' and ts > strftime('%s','now')-1800 order by id desc limit 10"
```
`command not found`가 없고 세션 rollout(`ls -t ~/.codex/sessions/*/*/*/*.jsonl | head -1`)에 `exec`로 shim을 부른 흔적 없이 MCP 툴 호출이 있으면 Codex 채널 통과 → 인수 체크박스 갱신. 네트워크 승인 프롬프트가 뜨면 승인(첫 npx 다운로드).

**Context.** 이 세션은 01 핸드오프 1의 Q1~Q3(버전 0.1.0·서버 이름·description)를 결정하고 npm `0.1.0`을 게시한 뒤 세 채널 인수를 시작했다. Claude 채널은 통과. Codex 채널은 두 번 걸렸다: (1) 폴더 드롭 설치가 안 돼 카탈로그를 생성기에 추가했고, (2) MCP 서버가 `sh: excalidraw-architect: command not found`로 죽어 CLI 폴백으로 그려졌다. 원인은 Codex가 MCP 서버를 cwd=플러그인 루트(레포 사본, `package.json` name이 npm 패키지와 동일)로 띄우고 npx가 그걸 로컬 프로젝트로 잡는 것. shim에 MCP 모드 `cd /`를 넣어 고쳤고 같은 조건에서 `initialize` 응답을 확인했지만, **실제 Codex 세션으로는 아직 재시험 안 했다.** 사용자는 이 수정이 "치팅 아니냐"고 물었고, 정석 대안 B(플러그인 루트를 `plugin/` 하위 폴더로 분리해 복사본에 `package.json`이 안 들어가게)를 설명했다. **B를 할지·언제 할지는 다음 세션에서 사용자와 결정** — 그릴 대상.

**Current Progress** (git 기준, 작업 트리 깨끗, `origin/main`보다 앞선 커밋 있음 — `git log origin/main..HEAD`로 확인, push는 지시 있을 때만):
- ✅ 핸드오프 1의 Q1~Q3 결정·반영 — `ee05201`, `3e016d1`
- ✅ npm `excalidraw-architect@0.1.0` 게시(사람, 계정 `leejuo`) — `6e7ad85`에 기록
- ✅ Claude 플러그인 채널 인수 통과(MCP 툴 경로, 스크린샷 확인) — `992e6b6`
- ✅ Codex 카탈로그 `.agents/plugins/marketplace.json`을 생성기 6번째 매니페스트로 추가, README 설치 명령 교체 — `53a8e8e`. 그 커밋의 `.gitignore` 예외는 무효였고(디렉터리째 제외 안의 `!`는 안 먹음) 파일이 untracked였다 — 검증 에이전트가 잡아냄. `.agents/*` 패턴으로 고쳐 추적 — 이 핸드오프 다음 커밋
- ✅ shim MCP 모드 `cd /` 수정, README의 Codex 식별자를 `$excalidraw-architect:archdraw`로 교정 — `3078ff0`
- ✅ 이 머신의 Codex에 플러그인 설치됨: 마켓플레이스는 **로컬 경로**(`codex plugin marketplace add /Users/ljo/Desktop/project/zero-code/excalidraw-architect`), 캐시 `~/.codex/plugins/cache/excalidraw-architect/excalidraw-architect/0.1.0`에 수정된 shim 반영 확인. GitHub 경로 설치는 push 뒤에나 가능
- ⏳ Codex 채널 MCP 경로 재시험 — 미실행
- ⏳ `npx skills add` 채널 — 미시작
- ⏳ 인수 체크박스 중 채널 항목은 세 채널이 다 끝나야 체크. 로컬 빌드(`ARCHDRAW_BIN`) 항목·`screenshot` png 위치 항목도 미확인

**Decisions Made.**
- Q1~Q3: 위 ✅ 표시 참조.
- 폴더 드롭 대신 카탈로그: Codex 0.155.1이 `~/.codex/plugins/<이름>`을 인식하지 않음(실측). 핸드오프 1의 "미결 3번" 판단은 틀렸었다.
- Codex MCP 기동 실패는 shim `cd /`(A)로 우선 해결. 대안 B는 미결.

**What Worked.** 다른 세션의 transcript를 직접 읽어 인수 판정(`~/.claude/projects/<cwd>/*.jsonl`, `~/.codex/sessions/…/*.jsonl`, `~/.codex/logs_2.sqlite`). SendMessage로 Claude 세션에 재시도를 시켜 스크린샷 확인. Codex 조건 재현은 플러그인 캐시 루트를 cwd로 shim에 `initialize`를 파이프.

**What Didn't Work.** ⚠️ 레포 루트(또는 그 사본)에서 `npx excalidraw-architect`는 항상 `command not found` — npx의 로컬 프로젝트 우선 규칙. `npx -p pkg cmd` 형태도 같다. ⚠️ `!`로 세션 안에서 `npm publish`하면 2FA 브라우저 창을 못 띄워 `EOTP`; 별도 터미널에서. ⚠️ macOS엔 `timeout`이 없다. 이 세션은 사용자가 npm·2FA·플러그인 설치 개념을 처음 접해 설명 왕복이 길었다 — 다음엔 한 번에 하나, 결과부터.

**Next Steps.**
1. First Action(Codex 재시험). 실패하면 `logs_2.sqlite`의 stderr 줄부터.
2. `npx skills add LeeJuOh/excalidraw-architect`(레포 밖, push 필요) → MCP 없는 Claude 세션에서 `/archdraw` → CLI 폴백으로 그리는지 transcript 확인. Claude 플러그인이 설치돼 있으면 MCP가 잡히므로 먼저 `/plugin uninstall excalidraw-architect`.
3. 그릴: 대안 B(플러그인 루트 분리)를 03에 넣을지, 별도 이슈로 뺄지, 안 할지. 비용은 매니페스트 6개 경로·생성기·카탈로그 `source` 변경·두 호스트 재설치 시험.
4. 남은 체크박스: `ARCHDRAW_BIN` 호스트 상속, `screenshot` png 위치.
5. README 두 언어의 Codex 행이 GitHub 경로 명령을 적고 있으니 push 후 그 명령으로 한 번 더 설치 확인.


**2026-09-21 — 인수 2/3 재시험(Codex 재시작 후): 서버는 붙었는데 스킬이 shim으로 감.** `/mcp`에 `archdraw: connected (26 tools)`. 그런데 세션 rollout은 SKILL.md를 읽고 곧바로 exec로 shim CLI를 실행했고 MCP 툴 호출은 0회. 그림은 나왔지만 인수 조건(플러그인 채널 = MCP 툴)은 미통과. 원인 판단: SKILL.md 본문에 shim 명령 예시가 있어 모델이 눈앞 예시를 따랐다 — "MCP 있으면 shim 금지" 문장으로는 못 막았다.

결정(사용자, A): SKILL.md를 구조로 강제. 본문은 MCP 툴 절만 두고 shim 명령 예시 전부 제거. CLI 사용법·툴↔커맨드 대응표·"서버 준비 중" 안내는 `references/canvas-ops.md`로 격리하고 "MCP 툴이 없을 때만 읽어라". 시작 안내 문구는 MCP 경로에서 아예 뺐다(서버는 호스트가 이미 띄웠으므로 문구 자체가 틀림). `check-pack-contents.mjs`에 참조 파일 추가. Codex 플러그인 재설치로 캐시 갱신. 03이 `canvas-ops.md`를 이 파일 위에 확장한다.

부수 확인: 01:14 세션에서 `screenshot` png가 `~/.excalidraw-architect/tmp/`에 생김 → 데이터 폴더 항목 체크. 세모 요청은 Excalidraw에 `triangle` 타입이 없어 스킬이 선으로 그렸다 — 도형 어휘는 03 몫.

다음: Codex **재시작** 후 `$excalidraw-architect:archdraw 박스 하나 그려줘` → rollout에 exec 없이 MCP 툴 호출이 있으면 Codex 채널 통과.

**2026-09-21 — 인수 2/3: Codex 플러그인 채널 통과.** SKILL.md 재구성 후 Codex 재시작, `$excalidraw-architect:archdraw 박스 하나 그려줘`. rollout: `mcp__archdraw__batch_create_elements` → `mcp__archdraw__get_canvas_screenshot`(이미지 반환). shim 실행 0회. 남은 채널: `npx skills add`(CLI 폴백, push 필요).

**2026-09-21 — 플러그인 루트 분리(대안 B) 반영.** 사용자 결정: 우회(`cd /`) 대신 정석. 플러그인 파일을 `plugin/`로 옮기고 루트 카탈로그 2개의 `source`를 `./plugin`으로. 생성기·`check-pack-contents`·`package.json` `files`(`plugin/**/*` 추가) 갱신, shim의 `cd /` 제거. [ADR-0011](../../../docs/adr/0011-plugin-lives-under-plugin-dir.md). 공식 문서 확인: Claude(`./plugins/my-plugin` 예시)·Codex(`{"source":"local","path":"./plugins/my-plugin"}` 예시) 둘 다 하위 폴더 지원. `npx skills add`는 skills CLI가 루트 Claude 카탈로그 `source` 아래 `skills/`를 탐색하므로 영향 없음(소스 확인). 로컬 검증: Codex 캐시에 `plugin/` 내용만 복사됨(`package.json` 없음), 그 루트를 cwd로 shim 무인자 실행 → `initialize` 응답. `npm test` 통과. 두 호스트 실세션 재시험은 사용자 몫 — Claude 채널은 push 후 `/plugin update`가 필요.

---

**2026-09-21 — 핸드오프 3: 구현 완료, 인수 시험만 남음(전부 사용자 실행)**

**Goal.** 01 인수 마무리. 코드·문서는 끝났고(`e9dab40`, push됨, 작업 트리 깨끗), 남은 체크박스 5개는 사용자가 호스트를 실제로 돌려야 확인된다. 에이전트 몫은 시험 결과를 로그로 판정하고 체크박스·README를 갱신하는 것.

**First Action.** 사용자에게 아래 시험 1을 시키고, 끝났다고 하면 최신 Codex rollout을 읽어 판정한다:
```
f=$(ls -t ~/.codex/sessions/*/*/*/*.jsonl | head -1); grep -o '"name":"[^"]*"' "$f" | sort | uniq -c
```
`mcp__archdraw__batch_create_elements` 호출이 있고 `exec`로 `scripts/archdraw`를 부른 흔적이 없으면 통과. 통과하면 시험 2로.

**남은 인수 시험(순서대로, 사용자 실행 — 에이전트는 설치·제거 명령을 대신 치지 않는다. 사용자가 "명령어로 넣는 건 괜찮다"고 했으니 확인 명령은 돼도, 설치는 사용자가 결과를 봐야 하므로 사용자가 한다):**
1. **Codex 재시험(새 `plugin/` 레이아웃).** 이 머신에는 에이전트가 `codex plugin add`로 로컬 경로 설치해 둔 상태(`codex plugin list` → `installed, enabled 0.1.0`, SOURCE `<레포>/plugin`). Codex를 완전히 종료 → 레포 밖 폴더에서 새로 켜기 → `$excalidraw-architect:archdraw 박스 하나 그려줘`. 판정은 First Action.
2. **Claude 재시험(새 레이아웃).** `/plugin update excalidraw-architect` → `/excalidraw-architect:archdraw 박스 하나 그려줘`. 판정: `~/.claude/projects/<cwd>/*.jsonl` 최신 파일에 `mcp__plugin_excalidraw-architect_archdraw__batch_create_elements` 호출, Bash shim 호출 없음.
3. ✅ **`npx skills add` 채널(CLI 폴백) 통과.** 자동 감지는 실행 중인 Codex만 골랐으므로 전역·호스트 명시형으로 정정했다: Codex는 `npx skills add LeeJuOh/excalidraw-architect --skill archdraw -g --agent codex -y`, Claude Code는 같은 명령의 `--agent claude-code`. 두 호스트 모두 MCP 툴 없이 `scripts/archdraw`를 실행했고, 같은 캔버스에 도형을 그렸다. 상세는 아래 "인수 3/3" 기록.
4. **오프라인 첫 호출 안내(선택).** `rm -rf ~/.npm/_npx`, 인터넷 끊고 시험 3 반복 → 에이전트가 "인터넷 없음"을 원인으로 말하면 체크박스 23번 줄 체크. Codex 샌드박스 변형은 01:08 세션에서 이미 확인됨.
5. **`ARCHDRAW_BIN` 호스트 상속(선택, 개발용).** `npm run build` → `export ARCHDRAW_BIN=<레포>/dist/bin.js` → 같은 셸에서 `codex`(또는 `claude`) → 박스 하나 → 다른 터미널에서 `ps aux | grep 'dist/bin.js'`에 node 프로세스가 보이면 체크박스 24번 줄 체크.

**Context.** 이 세션은 핸드오프 2의 셋을 처리했다. (a) Codex 재시험: 첫 시도(01:37)는 `/mcp`에 `archdraw: connected (26 tools)`인데도 모델이 SKILL.md의 shim 예시를 따라 CLI로 그렸다 → SKILL.md를 구조로 고쳐(본문은 MCP 절만, CLI는 `references/canvas-ops.md`로 격리) 재시험(01:48)에서 MCP 툴 경로 통과. (b) "플러그인 루트 = 레포 루트" 문제는 사용자가 정석(B)을 택해 `plugin/` 하위로 분리, shim `cd /` 제거, ADR-0011. 두 호스트 공식 문서에서 하위 폴더 `source` 지원을 확인했고, skills CLI 소스에서 루트 Claude 카탈로그의 `source` 아래 `skills/`를 탐색함을 확인했다. (c) 그러나 **새 레이아웃으로는 두 호스트 실세션 재시험을 아직 안 했다** — 로컬 검증(Codex 캐시에 `plugin/` 내용만 복사, 그 루트 cwd에서 shim 무인자 → `initialize` 응답)까지만.

**Current Progress** (git 기준, `main` = `origin/main` = `e9dab40`, 작업 트리 깨끗):
- ✅ SKILL.md MCP-first 재구성 + `references/canvas-ops.md` 신설, `check-pack-contents.mjs`에 참조 파일 추가 — `aa6d35b`
- ✅ Codex 채널 인수 통과(구 레이아웃, MCP 경로) — `ddde7a3`
- ✅ 플러그인 `plugin/` 분리: 생성기 `PLUGIN_DIR`, 루트 카탈로그 2개 `./plugin`, `package.json` `files`에 `plugin/**/*`, shim `cd /` 제거, AGENTS.md gotcha, ADR-0011 — `e9dab40`
- ✅ 체크박스: 17·18·19·25·26번 줄 체크됨
- ✅ 체크박스 22번 줄: Codex 전역 `$archdraw`가 치환 없이 shim CLI 실행
- ⏳ 체크박스 20·21·23·24번 줄: 새 레이아웃 플러그인 재시험 2개, 엄격한 첫 실패 안내, `ARCHDRAW_BIN` 호스트 상속
- ⏳ Claude 채널·Codex 채널 모두 **새 레이아웃으로 재확인 필요**(구 레이아웃 통과 기록은 유효하지만 경로가 바뀌었다)

**Decisions Made.**
- SKILL.md는 예시로 유도: "MCP 있으면 shim 금지" 문장은 안 먹혔고, 본문에서 shim 명령을 치우자 먹혔다(사용자 A 선택).
- 시작 안내 문구("서버 준비 중, 첫 실행은 다운로드")는 MCP 경로에서 뺐다. 서버는 호스트가 이미 띄웠으므로 문구가 틀리다. CLI 절에만 남김.
- 플러그인 루트 분리는 정석(B). 우회 `cd /`는 폐기. 근거·대안은 ADR-0011.
- 세모 요청은 Excalidraw에 `triangle` 타입이 없어 선으로 그려짐 — 도형 어휘는 03 몫.

**What Worked.** 호스트 세션 기록 직접 읽기: Codex `~/.codex/sessions/<y>/<m>/<d>/rollout-*.jsonl`(payload.type이 `custom_tool_call`/`message`), `~/.codex/logs_2.sqlite`(`MCP server stderr` 줄), Codex TUI `/mcp`로 서버 연결·툴 수 확인. Codex 조건 재현은 캐시 플러그인 루트를 cwd로 shim에 `initialize` 파이프. 사용자 요청 형식: 한 번에 하나, 결과부터, 장황 금지.

**What Didn't Work.** ⚠️ Codex 재시작 없이 새 스레드만 열면 MCP 서버는 옛 상태 그대로 — 재시험은 반드시 프로세스 재시작. ⚠️ rollout의 마지막 assistant 줄만 보고 "실패"로 오판했다 — 전체 순서를 출력해 판정할 것. ⚠️ 에이전트가 사용자 몫 시험(플러그인 재설치)을 대신 실행하자 사용자가 불편해했다 — 설치·시험은 사용자, 에이전트는 판정. ⚠️ macOS에 `timeout` 없음. ⚠️ 레포 루트(또는 그 사본)에서 `npx excalidraw-architect`는 `command not found` — 이제 플러그인 복사본에는 해당 없고 레포 안 개발자만 해당.

**Next Steps.** 새 레이아웃의 Codex·Claude 플러그인 재시험(위 1·2) → 체크박스 20·21 판정. 선택 시험 4·5 중 4는 이번 Codex 시험에서 같은 실패를 한 번 조용히 재시도해 엄격 조건을 충족하지 못했고, 5는 미시험이다. 모두 판정한 뒤 01 Status를 닫고 다음 구현 순서인 09로 간다.

---

**2026-09-21 — 인수 3/3: `npx skills add` CLI 폴백 통과.**

- 설치: `-g` 없이 실행하면 임시 프로젝트의 `.agents/skills/archdraw`에만 설치됐다. 전역 시험은 `-g`가 필요했고, 자동 감지가 Codex만 골라 Claude Code에는 설치되지 않았다. `--agent codex`와 `--agent claude-code`를 각각 명시한 뒤 `~/.agents/skills/archdraw`와 `~/.claude/skills/archdraw`를 확인했다. README 두 언어를 이 명령으로 수정했다.
- Codex: `$archdraw 박스 네모 하나 추가해줘` → archdraw MCP 툴 없음 확인 → `references/canvas-ops.md` 읽기 → `scripts/archdraw describe`·`add`·`screenshot` 실행. rollout에 archdraw MCP 호출은 없고 `excalidraw-architect@0.1.0` CLI 실행과 사각형 생성이 있다. 처음 두 `describe`는 샌드박스의 npm DNS 차단(`ENOTFOUND`)으로 실패했고, 네트워크 승인을 받은 재시도는 성공했다.
- Claude Code: `/archdraw`로 삼각형 요청 → archdraw MCP 툴 없이 `~/.claude/skills/archdraw/scripts/archdraw describe`·`add`·`screenshot` 실행. Excalidraw에 삼각형 기본 타입이 없어 닫힌 `line`으로 만들었다.
- 화면 확인: 브라우저를 열기 전 두 호스트의 `screenshot`은 요구대로 실패했다. Chrome에서 `http://127.0.0.1:3000`을 연 뒤 CLI 스크린샷과 CUA REPL로 `Connected` 상태, 파란 삼각형과 흰 테두리 사각형이 같은 캔버스에 보이는 것을 확인했다. CLI `describe`는 요소 2개(`line(1)`, `rectangle(1)`)를 반환했다.
- 남은 지적: Codex는 첫 `ENOTFOUND` 뒤 같은 명령을 한 번 조용히 재시도하고 나서 원인을 알렸다. 원인 안내 자체는 맞았지만 SKILL.md의 "Do not retry silently"와 체크박스 23의 엄격한 "첫 호출 시" 조건은 충족하지 않아 체크하지 않았다.
- 정리: 시험 뒤 사용자 요청으로 전역 `archdraw`를 제거했고 `~/.agents/skills/archdraw`·`~/.claude/skills/archdraw`가 모두 사라진 것을 확인했다.

---

**2026-09-21 — 인수 4/4·5/5: 새 `plugin/` 레이아웃으로 플러그인 두 채널 재시험 통과.** 두 호스트 모두 GitHub에서 새로 설치했다(`e9dab40` 레이아웃). 시험 폴더는 레포 밖 `claude-code-zero`.

- Codex: `codex plugin marketplace add` → `codex plugin add` → 재시작 → `$excalidraw-architect:archdraw 세모 박스 하나 더 추가해줘`. 캐시 경로는 `~/.codex/plugins/cache/excalidraw-architect/excalidraw-architect/0.1.0/skills/archdraw/SKILL.md`로 `package.json` 없이 `plugin/` 내용만 복사됐다. rollout의 툴 호출은 `exec` 6회뿐인데 전부 Codex의 통합 exec(JS 런타임)에서 `tools.mcp__archdraw__describe_scene`·`get_canvas_screenshot`·`get_element`·`duplicate_elements`를 부른 것이고, 셸 명령이나 `scripts/archdraw` 실행은 없다. 로그의 `scripts/archdraw` 문자열 1건은 SKILL.md frontmatter `allowed-tools`가 컨텍스트로 들어간 것. **판정 주의:** Codex는 이제 MCP 툴을 `exec` 안의 함수로 부르므로 `"name":"exec"` 개수만 보고 shim 실행으로 오판하지 말 것. 스크립트 본문에 `tools.mcp__archdraw__*`가 있으면 MCP 경로다.
- Claude Code: `/plugin marketplace add` → `/plugin install` → `/reload-plugins` → `/excalidraw-architect:archdraw 네모박스 하나더추가해줘`. 캐시 경로 `~/.claude/plugins/cache/excalidraw-architect/excalidraw-architect/0.1.0/skills/archdraw`. transcript에 `mcp__plugin_excalidraw-architect_archdraw__describe_scene`·`get_canvas_screenshot`·`create_element` 호출, Bash 호출 0회. 스킬 본문의 `ToolSearch`로 MCP 툴을 먼저 로드한 뒤 썼다.
- 캔버스: Codex가 선 삼각형을 복제해 오른쪽에, Claude가 사각형(300,360)을 아래에 추가. `describe_scene`이 Claude 세션 시작 시 요소 3개(`line(2)`, `rectangle(1)`)를 반환해 두 호스트가 같은 캔버스를 봤음이 확인된다.
- 결과: 체크박스 20·21번 줄 체크. 남은 미체크는 선택 시험 23(오프라인 엄격 조건)·24(`ARCHDRAW_BIN` 호스트 상속) 둘뿐.

---

**2026-09-21 — 닫음.** 필수 인수 조건 전부 통과(세 채널 모두 새 `plugin/` 레이아웃 기준). 선택 시험 2개(오프라인 엄격 조건·`ARCHDRAW_BIN` 호스트 상속)는 사용자 결정으로 미실시. 두 플러그인은 설치 상태로 둔다 — 이후 이슈의 재시험에 그대로 쓴다. 다음: 구현 순서 2의 09.

---

**2026-09-23 — 사후 검수에서 나온 결함 (01·09 범위 `76ef137...ec75a59`).** Status는 그대로 뒀다. 아래 항목은 남은 이슈(03~08)를 다 구현해도 해소되지 않는다. 6번만 04에서 같이 다룰 수 있다.

1. **[높음] CLI 스크린샷이 다른 플러그인의 데이터 폴더에 저장된다.** `src/core/data-dir.ts:22`는 환경 변수 `CLAUDE_PLUGIN_DATA`를 그대로 믿는다. 그런데 Claude Code의 Bash 환경에는 다른 플러그인의 값이 들어 있을 수 있다(실측값 `~/.claude/plugins/data/codex-openai-codex`). CLI는 에이전트의 Bash에서 돌기 때문에, `npx skills add` 채널의 `screenshot` png가 그 폴더에 저장된다. 인수 25는 Codex에서만 확인했다. 06이 같은 우선순위로 스냅샷을 저장하므로, 고치지 않으면 결함이 06으로 번진다.
2. **[중간] 유효한 `PLUGIN_DATA`를 건너뛴다.** 같은 줄의 `??`는 값이 `undefined`일 때만 다음 후보로 넘어간다. 그래서 `CLAUDE_PLUGIN_DATA`가 빈 문자열이거나 치환되지 않은 `${...}`이면 `PLUGIN_DATA`를 보지 않고 홈으로 간다. 검사는 trim한 값으로 하면서 반환은 trim 전 값을 한다.
   ✅ **1·2 처리 (2026-09-24 그릴):** 데이터 폴더를 호스트 변수 없이 항상 `~/.excalidraw-architect/`로 정했다([ADR-0013](../../../docs/adr/0013-data-folder-fixed-under-home.md)). Claude·Codex·CLI 모두 같은 폴더를 쓴다. 같은 날 재그릴로 스크린샷은 데이터 폴더에서 빼 OS 임시 폴더로 되돌렸고, 덮어쓰기 변수 `ARCHDRAW_DATA_DIR`는 두지 않는다(슬라이스 1 핸드오프 Q1·Q2). 문서(ADR-0009·0013, 스펙의 "데이터 폴더:"·7-5 (c)·Testing Decisions)와 코드·스킬 문구 모두 슬라이스 1에서 반영했다.
3. **[중간] 게시 전에 타르볼 검사가 없다.** 수동 `npm publish`(`prepublishOnly`는 build만 실행)와 `npm-publish.yml` 둘 다 `check-pack-contents`·`test:manifests`를 돌리지 않는다. 09 이후로는 `docs/canvas-guide.md`가 빠진 채 게시되면 게시본 서버가 시작하자마자 `exit 1`로 죽는다. `prepublishOnly`에 두 검사를 붙이면 두 게시 경로를 모두 막을 수 있다.
   ✅ **처리 (2026-09-24 그릴):** 로컬 게시를 없애고 GitHub 릴리즈 → 게시 워크플로 하나로 정했다. 워크플로는 `npm test`와 필수 파일 검사를 통과해야 게시하고, 인증은 Trusted Publishing이다(레포 Actions secrets는 비어 있음, 2026-09-24 `gh secret list`). 상세·대안은 스펙 7-5d, 테스트 경계는 스펙 Testing Decisions. 코드는 슬라이스로 구현한다.
4. **[낮음] CI가 `test:data-dir`를 돌리지 않는다.** `ci.yml`에 없다. `test:bind`·`test:skill-docs`도 빠져 있다.
   ✅ **처리 (2026-09-24 그릴):** `ci.yml`의 개별 테스트 단계를 `npm test` 한 단계로 바꾼다. `npm test`에 없는 단계(타입 검사·빌드·브라우저 회귀·필수 파일 검사)는 그대로 둔다. 스펙 Testing Decisions. `test:bind`가 GitHub 러너에서 포트를 열 수 있는지는 첫 push에서 확인한다.
5. **[낮음] ADR-0011의 cwd 서술이 Claude Code에 대해 틀렸다.** ADR은 "Claude Code와 Codex는 … 그 루트를 cwd로 띄운다"고 적었지만, Claude Code는 MCP 서버를 세션 cwd에서 띄운다. 그래서 이 레포에서 claude를 켜면 설치된 플러그인의 MCP가 `sh: excalidraw-architect: command not found`로 죽는다. npm이 레포의 `package.json`을 로컬 프로젝트로 잡기 때문이다(2026-09-23 이 레포 세션의 MCP 로그). 개발자에게만 해당하고 `ARCHDRAW_BIN`으로 피할 수 있다. ADR 문장과 AGENTS.md gotcha를 고칠 것.
   ✅ **처리 (2026-09-24 그릴):** 문서만이 아니라 원인을 고친다. shim의 npx 줄에 `--prefix <폴더>`를 준다. 원인은 npm 공식 문서(npm-exec)의 "Package names with a specifier will only be considered a match if they have the exact same name and version as the local dependency"다. 이 레포가 이름·버전이 같아 로컬 프로젝트로 잡힌다. `--prefix`는 npm 공식 문서(config)상 "forces non-global commands to run in the specified folder"다. 실측(2026-09-24, 이 레포 cwd): `npx -y excalidraw-architect@0.1.0 --version` → `command not found`, `npx --prefix <빈 폴더> -y excalidraw-architect@0.1.0 --version` → `0.1.0`, `-c pwd` → 실행 폴더는 레포 그대로, 빈 폴더에 생긴 파일 없음. 실행 폴더가 바뀌지 않으므로 서버가 cwd를 쓰는 곳(`src/core/config.ts` → `ALLOWED_EXPORT_DIR`, 04의 프로젝트 루트)과 부딪히지 않는다. ADR-0011의 "Claude도 플러그인 루트를 cwd로" 문장은 고친다: 공식 문서(plugins-reference, mcp)에는 플러그인 stdio MCP 서버의 cwd가 없고, 실측은 세션 폴더다(2026-09-23 MCP 로그 `cwd`, 2026-09-24 v2.1.280 이 레포에서 `CONNECTION_CLOSED` 재현). 코드는 슬라이스로 구현한다.
6. **[낮음] 에러 문구가 실행할 수 없는 명령을 안내한다.** `src/core/spawn.ts:45`의 연결 실패 문구는 `excalidraw-architect start`를 권하는데, 이 명령은 어느 채널에서도 PATH에 없다. 04의 Q3(업스트림 `start`/`stop`/`status` 처리)에서 같이 볼 것.
   ✅ **처리 (2026-09-24 그릴):** 04로 넘긴다. 04가 캔버스 서버를 켜는 방식(`session start`, MCP 자동 기동)과 업스트림 `start` 존폐를 바꾸므로 지금 고치면 다시 고쳐야 한다. 04 Q3에 이 문구(`src/core/spawn.ts` → `unreachableError()`)를 함께 고칠 대상으로 적는다.

보류: npm 게시본 0.1.0에는 09가 없다(`design-guide.js`와 `read_diagram_guide`는 있고 `guide://canvas`는 없다). 다음 게시 때 해소된다. 순서는 버전 올리기 → `npm run manifests` → **게시 먼저, push는 그다음**이다. 반대로 하면 shim이 아직 없는 버전을 가리킨다. → **2026-09-24 대체:** 순서는 `npm version` → push → 릴리즈 → 워크플로 게시다. push 뒤 게시 완료까지 몇 분 동안 shim이 아직 없는 버전을 가리키는 것은 감수한다(스펙 7-5d, 아래 슬라이스 2).

정리함: 커밋 트레일러가 붙은 커밋 7개(`78cb304`·`a0e174a`·`e4ef4eb`, 03 작업의 4개)는 이미 push돼 그대로 둔다. 원인은 전역 `~/.claude/settings.json`의 `attribution` 빈 값으로 막았다.

---

### 슬라이스 1 — 데이터 폴더를 한 곳으로 (사후 검수 1·2)

**What to build:** 데이터 폴더는 어느 호스트·채널에서든 `~/.excalidraw-architect/`다. 다른 플러그인이 셸에 넣은 `CLAUDE_PLUGIN_DATA`가 있어도 따라가지 않는다([ADR-0013](../../../docs/adr/0013-data-folder-fixed-under-home.md)). 데이터 폴더는 06 스냅샷만 쓴다. CLI 스크린샷 png의 기본 위치는 데이터 폴더가 아니라 OS 임시 폴더다(스펙 7-5 (c)).

**Blocked by:** None (can start immediately)

**Status:** resolved (2026-09-24 — 1차 구현 뒤 Q1·Q2 결정으로 재작업, 인수 4개 통과)

**테스트 경계(합의됨):** 데이터 폴더를 돌려주는 공개 함수 `pluginDataDir()`. 기대값은 `HOME`을 임시 폴더로 고정하고 문자열 그대로 적는다. 스크린샷 기본 위치는 브라우저 탭이 있어야 찍혀 테스트하지 않는다.

- [x] `CLAUDE_PLUGIN_DATA`·`PLUGIN_DATA`가 남의 폴더를 가리켜도 데이터 폴더는 홈 아래 `.excalidraw-architect`다
- [x] 호스트 변수가 없어도 같은 폴더다
- [x] CLI `screenshot`의 기본 출력 경로가 OS 임시 폴더이고, 스킬의 CLI 폴백 안내도 그렇게 적는다
- [x] `npm test` 통과

**2026-09-24 — 구현(에이전트).** `src/core/data-dir.ts`의 `pluginDataDir()`는 `~/.excalidraw-architect`만 돌려준다. 호스트 변수와 `${...}` 치환 안 된 값을 거르던 가드는 지웠다. `scripts/check-data-dir.mjs`는 합의된 경계대로 다시 썼다. 첫 단언은 옛 코드에서 red였다(남의 `CLAUDE_PLUGIN_DATA`를 그대로 반환). `generate-manifests.mjs`의 "MCP 경로는 데이터 폴더가 필요 없다" 주석은 옛 규칙을 전제해 지웠다.

**2026-09-24 — 재작업(에이전트, Q1·Q2).** 1차 구현은 `ARCHDRAW_DATA_DIR` 덮어쓰기와 `pluginTmpDir()`(스크린샷을 `~/.excalidraw-architect/tmp/`에)를 두었다. 둘 다 뺐다. `src/cli/commands/scene.ts`의 `screenshot()` 기본 경로를 업스트림 값 `os.tmpdir()`로 되돌렸고, `check-data-dir.mjs`에서 두 기능의 단언 4개를 지웠다. `canvas-ops.md`는 "Screenshots land in the OS temp folder unless `--out` is given."으로 바꿨다. 재작업 뒤 `pluginDataDir()`를 부르는 프로덕션 코드는 없다 — 06 스냅샷이 쓸 함수이고 합의된 경계라 남겼다. `npm run type-check`·`npm test` 통과.

**2026-09-24 — 보안 리뷰 지적, 조치 안 함(사용자 결정 C).** 자동 보안 리뷰가 지적했다: `scene.ts` → `screenshot()`은 이름을 짐작할 수 있는 임시 파일(`excalidraw-screenshot-<ms>.png`)에 `writeFileSync` 기본 플래그로 써서, 같은 이름의 심볼릭 링크가 있으면 그 대상을 덮어쓴다. 해당하는 곳은 공용 `/tmp`를 쓰는 Linux뿐이다. macOS `$TMPDIR`는 사용자 전용이다(`drwx------`, 실측). 개발자 개인 PC용 도구이고 업스트림과 같은 코드라 그대로 둔다. 기각한 안: 기본 경로일 때 `{ flag: 'wx' }` / `fs.mkdtempSync` 폴더 안에 쓰기. Linux `protected_symlinks` 기본값은 확인하지 않았다.

---

### 슬라이스 2 — 릴리즈 한 경로 (사후 검수 3)

**What to build:** 유지보수자가 버전을 올리고 GitHub 릴리즈를 만들면, 게시 워크플로가 `npm test`와 필수 파일 검사를 통과한 경우에만 npm에 게시한다. 저장된 토큰은 쓰지 않는다(Trusted Publishing). 버전 커밋에는 새 버전을 가리키는 매니페스트와 shim이 함께 들어간다. 경로·대안은 스펙 7-5d.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**테스트 경계(합의됨):** 새 시임 없음. 게시 관문은 기존 `npm test`와 필수 파일 검사다(스펙 Testing Decisions).

- [ ] `npm version <버전>`을 실행하면 버전 커밋 하나에 매니페스트·shim의 새 버전이 들어가고, 이어서 `test:manifests`가 통과한다
- [ ] 게시 워크플로는 릴리즈 생성으로만 실행된다. 수동 실행 경로와 릴리즈 첨부 파일 단계가 없다
- [ ] 게시 워크플로가 Node 22에서 npm을 11.5.1 이상으로 올리고, `NPM_TOKEN` 검사와 토큰 env가 없다
- [ ] 게시 워크플로에서 `npm test`와 필수 파일 검사가 게시 단계보다 앞에 있다
- [ ] 사람 몫(별도 체크): npmjs.com에 Trusted Publisher 등록 → 슬라이스 1·3·4가 들어간 뒤 첫 릴리즈 → Actions 로그에서 검사 → 게시 순서를 확인하고 `npm view`로 게시를 확인

**2026-09-25 — 착수 전 결정(그릴, 사용자).** 세 가지 모두 A.
- 수동 실행 경로(`workflow_dispatch`)는 지운다. 실패한 게시는 그 실행을 re-run한다. re-run은 원래 이벤트의 `GITHUB_SHA`·`GITHUB_REF`를 쓰고 30일 안에 된다(GitHub 문서 re-run-workflows-and-jobs). 입력값을 `run:`에 그대로 넣던 줄도 같이 사라진다.
- Node는 22로 두고 npm만 11로 올린다. 22에 딸린 npm은 10.9.9, 24는 11.19.0이다(nodejs.org 릴리즈 페이지). push CI 매트릭스가 20·22라, 24로 게시하면 CI가 돌려 본 적 없는 Node에서 게시 전 `npm test`가 돈다.
- 릴리즈 첨부 파일(`dist` 압축 업로드) 단계는 지운다. 서버는 shim이 npm에서만 받고, 그 압축에는 플러그인과 `package.json`이 없다. 워크플로의 `contents` 권한은 `read`로 내린다.

구현 기본값(문서로 확인함):
- `--provenance`는 뺀다. Trusted Publishing이 provenance를 자동으로 붙인다(npm 문서 trusted-publishers).
- `setup-node`의 `registry-url`은 둔다. npm CLI는 OIDC를 토큰보다 먼저 쓴다(같은 문서).
- 업스트림 "Verify build artifacts" 단계는 필수 파일 검사로 바꾼다. 필수 파일 검사가 같은 세 파일을 포함한다.
- `version` 훅은 `npm run manifests && git add -u`다. 훅은 버전을 올린 뒤, 커밋 전에 돈다(npm 문서 npm-version 4단계). `-u`는 추적 중인 변경 파일만 올리므로 생성물 목록을 생성기와 두 벌로 두지 않는다.
- 워크플로 파일 이름은 바꾸지 않는다. npmjs.com에 등록하는 이름과 똑같아야 한다(같은 문서).

---

### 슬라이스 3 — CI가 `npm test` 전체를 돌린다 (사후 검수 4)

**What to build:** push CI가 테스트를 하나씩 나열하지 않고 `npm test`를 통째로 돌린다. 그래서 `npm test`에 새로 넣은 테스트(지금 빠진 스킬 문서·로컬 바인드·데이터 폴더 검사 포함)가 CI에서 빠지지 않는다. `npm test`에 없는 타입 검사·빌드·브라우저 회귀·필수 파일 검사 단계는 그대로 둔다.

**Blocked by:** None (can start immediately)

**Status:** resolved (2026-09-24 — 로컬 `npm test` 통과, 첫 push CI 확인 남음)

- [x] CI에 개별 테스트 단계(매니페스트, MCP stdio) 대신 `npm test` 한 단계가 있다
- [ ] 첫 push에서 CI가 통과한다. 특히 `test:bind`가 GitHub 러너에서 포트를 여는지 확인한다(미확인)

**2026-09-24 — 구현(에이전트).** `ci.yml`의 "Build and Type Check" 잡에서 "Check generated manifests are current"와 "Run MCP stdio wire tests"를 지우고, 빌드 뒤 원래 MCP 자리에 "Run tests"(`npm test`)를 넣었다. 나머지 단계는 그대로다. 로컬 `npm test`는 5개(manifests·skill-docs·mcp·bind·data-dir) 모두 통과했다. 처음엔 `| tail`을 붙여 돌려 허용 규칙 `Bash(npm test)`와 맞지 않았고 권한 분류기에 막혔다(AGENTS.md "Bash 한 호출에는 셸 구성 하나만" 위반). 코드 리뷰 두 축 모두 위반은 없었다. 비용만 드는 부수 효과가 둘 있어 그대로 뒀다: 매니페스트 드리프트 검사가 타입 검사·빌드 뒤로 밀렸고, `test:mcp`·`test:bind`·`test:data-dir`가 각자 `build:server`를 다시 돌린다(`package.json`, 범위 밖).

---

### 슬라이스 4 — 이 레포에서 켜도 archdraw MCP가 뜬다 (사후 검수 5)

**What to build:** 이 레포 폴더에서 Claude Code를 켜도 설치된 플러그인의 archdraw MCP 서버가 `command not found`로 죽지 않는다. shim이 npx를 부를 때 `--prefix`로 shim 자기 폴더를 주어, npx가 cwd의 같은 이름 `package.json`을 로컬 프로젝트로 잡지 않게 한다. 실행 폴더(cwd)는 바뀌지 않는다. 근거·실측은 사후 검수 5와 [ADR-0011](../../../docs/adr/0011-plugin-lives-under-plugin-dir.md).

**Blocked by:** None (can start immediately)

**Status:** resolved (2026-09-24 — 에이전트 인수 3개 통과, 마지막 칸은 슬라이스 2의 첫 릴리즈 뒤 사람이 확인)

**테스트 경계(합의됨):** 새 테스트 없음. shim 내용은 기존 `test:manifests`가 생성기 출력과 비교한다(스펙 Testing Decisions).

- [x] 생성기에서 shim의 npx 줄에 `--prefix`(shim 자기 폴더)가 들어가고, 재생성한 shim이 커밋된다
- [x] AGENTS.md Gotchas의 플러그인 위치·게시본 검증 두 줄이 새 동작에 맞는다(`writing-for-agents` 스킬 기준)
- [x] `npm test` 통과
- [ ] 다음 릴리즈 뒤: 이 레포에서 claude를 켜면 archdraw MCP가 붙는다

**2026-09-24 — 구현(에이전트).** 생성기 shim 템플릿의 npx 줄에 `--prefix "$(dirname "$0")"`를 넣고 재생성했다. 주석은 넣지 않았다(이유는 ADR-0011). 재생성 전 `test:manifests`는 shim 드리프트로 red였다. 로컬 확인은 `ARCHDRAW_BIN`을 비우고 레포 루트 cwd에서 했다. shim `--version` → `0.1.0`, 맨 `npx -y excalidraw-architect@0.1.0 --version` → `command not found`, 스킬 루트에서 `scripts/archdraw --version`(상대 `$0`) → `0.1.0`, `sh <절대 경로 shim>`에 MCP `initialize` → `serverInfo` `excalidraw-architect 0.1.0`. shim 폴더에 `node_modules`나 lock 파일은 생기지 않았다(`ls`, `git status --ignored`). AGENTS.md는 플러그인 줄에서 더는 사실이 아닌 실패 서술을 지웠고, 게시본 줄은 "shim으로 검증, 맨 npx는 실패"로 바꿨다. 리뷰가 찾은 옛 npx 줄(`--prefix` 없음) 2곳도 고쳤다: ADR-0002 5행은 `--prefix`를 넣고 ADR-0011을 가리키게, `check-pack-contents.mjs` 3행 주석은 명령을 적지 않게.

---

## 핸드오프 — 사후 검수 슬라이스 2 구현 (2026-09-25, 7차)

**목표.** 01 사후 검수의 마지막 에이전트 슬라이스인 2(릴리즈 한 경로)를 구현한다. 결정은 끝났다. 로드맵은 `1 ✅ → 4 ✅ → 3 ✅ → 2 ▶`다.

**첫 행동.** 아래 "착수 전 질문" 하나를 사용자에게 묻고, 답을 슬라이스 2의 2026-09-25 기록 밑에 적는다. 그다음 슬라이스 2의 `Status:`를 `claimed`로 바꾸고 구현한다. 구현 범위는 슬라이스 2의 인수 5칸과 "2026-09-25 — 착수 전 결정" 기록(결정 3개 + 구현 기본값 5개)이 전부다. 거기 적힌 것은 다시 묻지 않는다.

**착수 전 질문 — Docker 이미지 게시 (2026-09-25 발견, 미결).** 업스트림 `.github/workflows/docker.yml`은 main push와 `v*.*.*` 태그 push마다 MCP 서버·캔버스 이미지 둘을 `ghcr.io`에 올린다(`push: true`, 조건 없음). 사용자가 방금 레포 Actions를 켰으므로 다음 push부터 실제로 돈다. 두 README에는 Docker 언급이 0건이다. 루트의 `Dockerfile`·`Dockerfile.canvas`·`docker-compose.yml`만 남아 있다. 7-5d의 "게시 경로는 하나다"(npm)와 겹치는 두 번째 배포물이다.
- (A) `docker.yml`을 지운다. 배포물은 npm 하나다. 서버는 shim이 npm에서만 받는다(ADR-0002). 루트 Docker 파일 3개를 같이 지울지도 함께 묻는다.
- (B) 둔다. 이미지는 계속 올라가지만 아무 문서도 안내하지 않는다.
- 추천: A. A가 되면 PRD 7-5d 대안 기각 목록과 슬라이스 2 인수에 한 줄씩 더한다.

**맥락.**
- 결정 기록에 없는 게시 워크플로 단계(버전 존재 확인, 릴리즈 태그 = 패키지 버전 확인, `notify` 잡)는 그대로 둔다.
- 인수 확인: `npm version <버전>`은 깨끗한 작업 트리를 요구하고, 커밋과 태그를 만든다. main이 아닌 임시 브랜치나 워크트리에서 돌려, 버전 커밋에 생성물이 들어갔는지와 `test:manifests` 통과를 본다. 태그와 브랜치는 사용자 확인 뒤에 지운다.
- Actions: 사용자가 `8ff7930`을 push한 뒤에 레포 Actions를 켰다. 그래서 워크플로 실행 기록이 0건이다(2026-09-25 `gh api repos/LeeJuOh/excalidraw-architect/actions/runs` → `total_count` 0). `ci.yml`의 트리거는 push와 PR뿐이다. 슬라이스 3의 둘째 칸(첫 push CI, `test:bind`)은 다음 push에서 판정한다.
- 사람 몫(슬라이스 2 뒤): npmjs.com에 Trusted Publisher 등록(레포 `LeeJuOh/excalidraw-architect`, 워크플로 파일 `npm-publish.yml`) → 첫 릴리즈.

### 진행 상태 (git 기준)

- 브랜치 `main`. `origin/main`은 `8ff7930`이다(push됨). 앞선 커밋은 `5857955`와 이 핸드오프를 담은 커밋이다. push는 사용자 지시가 있을 때만 한다.
- ✅ 슬라이스 1 `8421776`, 슬라이스 4 `cfb09e4`, 슬라이스 3 `baeea70`. 3·4의 남은 칸은 push와 첫 릴리즈 뒤에 판정한다.
- ✅ 슬라이스 2 결정 기록 `5857955`: 티켓 슬라이스 2의 인수 5칸, 결정 3개, 구현 기본값, 그리고 PRD 7-5d 보강.
- ⏳ 슬라이스 2 구현: 코드 변경 없음. `Status: ready-for-agent`.

### 결정

- 이번 세션의 결정(수동 실행 경로 삭제, Node 22 + npm 11, 릴리즈 첨부 파일 삭제)은 슬라이스 2 기록과 PRD 7-5d에 있다.
- `/to-spec`은 기존 PRD를 고칠 때 쓰지 않는다. 새 spec 파일을 만드는 스킬이라 PRD가 중복된다. PRD는 직접 고친다.
- `pluginDataDir()` → `dataDir()` 개명은 06으로 미룬다. PRD와 티켓에 테스트 경계 이름으로 박혀 있어서다.
- 사람이 확인할 칸만 남은 슬라이스는 `Status: resolved (날짜 — 남은 칸 설명)`으로 닫는다. 슬라이스 4가 선례다.
- 코드 주석이나 ADR 본문에 셸 명령을 옮겨 적지 않는다. 주석은 ADR을 가리키게 쓴다.

### 통한 것

- 구현 흐름: 시작 보고 → 코드 → `npm test` → `/code-review` 서브에이전트 2개(Standards·Spec) 병렬 → 지적 반영 → 끝 보고 → 사용자 확인 뒤 커밋. 2026-09-25 세션의 스킬 목록에는 `/implement`가 없었다. 없으면 이 흐름을 직접 따른다.
- 그릴: 질문은 한 번에 하나, 개념은 아스키 그림 한 장으로 설명한다("수동 게시 버튼이 뭐냐"는 그림 한 장으로 풀렸다). 전제가 헷갈리는 질문은 전제부터 푼다(Node와 npm은 따로 올릴 수 있는 별개 프로그램).
- 미확인 사실은 공식 문서로 바로 확인했다: npm trusted-publishers, npm-version, GitHub re-run-workflows-and-jobs, nodejs.org 버전별 릴리즈 페이지(번들 npm 버전).
- 결정을 바꾼 뒤에는 `src`·`scripts`·`plugin`·`docs`·`.scratch`에서 옛 문자열을 grep한다.

### 안 통한 것

- ⚠️ **보고는 짧게.** 이번 세션에서도 "장황하게말하지마"를 두 번 들었다. 결론 한 줄 + 질문 하나로 쓴다. 기본값과 후속 순서는 물을 때가 아니면 싣지 않는다.
- ⚠️ 문서 반영과 구현은 따로 승인받는다. "반영한 뒤 구현할게요"라고 묶어 제안했다가 "구현은 하지마"를 들었다.
- ⚠️ **명령은 허용 목록과 똑같이 친다.** `npm test`에 파이프나 리다이렉트를 붙이면 `.claude/settings.json`의 `Bash(npm test)`와 어긋나 분류기에 막힌다.
- ⚠️ 빈 Bash 출력은 확인 실패다. `gh run list`는 빈 출력이었고, `--json`과 API로 0건을 확인했다. 원인(Actions 꺼짐)은 사용자에게 들었다.
- ⚠️ 권한 거절 원인을 추측으로 말하지 않는다. 먼저 `.claude/settings.json` 허용 목록을 본다.
- ⚠️ 문제를 보고할 때 코드 문제인지 문서 문제인지 먼저 밝힌다. 주석은 꼭 필요할 때만 쓴다. `spec.md`는 **PRD**라고 부른다. 경로는 절대경로로 쓴다.

### 남은 단계

1. 첫 행동(Docker 질문 → 슬라이스 2 구현). 끝 보고에서 push할지 묻는다.
2. push하면 첫 CI 실행으로 슬라이스 3의 둘째 칸을 판정한다. `test:bind`가 실패하면 그 출력부터 본다. `docker.yml`이 남아 있으면 이미지 게시도 같이 돈다.
3. 사람 몫: Trusted Publisher 등록 → `npm version <버전>` → `git push --follow-tags` → `gh release create v<버전>` → Actions 로그에서 검사 → 게시 순서 확인 → `npm view`. 그 뒤 슬라이스 2의 사람 칸과 슬라이스 4의 마지막 칸을 판정한다.
4. 01 슬라이스가 모두 끝나면 PRD "지금 할 일" 1번과 이슈 표의 01 행을 고친다. 다음은 09 사후 검수 그릴이다.

