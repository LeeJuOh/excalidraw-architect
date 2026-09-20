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
- [x] `npm run manifests` 한 번으로 매니페스트 6개(2026-09-21 Codex 카탈로그 추가)와 shim 버전이 생성되고, 버전은 `package.json` 한 곳만 바꾸면 전부 따라온다
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

**2026-09-21 — 핸드오프 2: Codex 재시험 + 플러그인 루트 분리 결정**

**Goal.** 01 인수 마무리. 남은 건 (a) Codex 플러그인 채널이 shim 수정 후 **MCP 툴 경로**로 그리는지, (b) `npx skills add` 채널의 CLI 폴백, (c) 인수 중 드러난 구조 문제 "플러그인 루트 = 레포 루트"를 어디서 고칠지 결정.

**First Action.** 사용자에게 레포 밖 폴더에서 Codex를 새로 켜고 `$excalidraw-architect:archdraw 박스 하나 더 그려줘`를 치게 한 뒤, 아래로 경로를 판정한다:
```
sqlite3 ~/.codex/logs_2.sqlite "select datetime(ts,'unixepoch','localtime'), substr(feedback_log_body,1,200) from logs where feedback_log_body like '%archdraw%' and ts > strftime('%s','now')-1800 order by id desc limit 10"
```
`command not found`가 없고 세션 rollout(`ls -t ~/.codex/sessions/*/*/*/*.jsonl | head -1`)에 `exec`로 shim을 부른 흔적 없이 MCP 툴 호출이 있으면 Codex 채널 통과 → 인수 체크박스 갱신. 네트워크 승인 프롬프트가 뜨면 승인(첫 npx 다운로드).

**Context.** 이 세션은 01 핸드오프 1의 Q1~Q3(버전 0.1.0·서버 이름·description)를 결정하고 npm `0.1.0`을 게시한 뒤 세 채널 인수를 시작했다. Claude 채널은 통과. Codex 채널은 두 번 걸렸다: (1) 폴더 드롭 설치가 안 돼 카탈로그를 생성기에 추가했고, (2) MCP 서버가 `sh: excalidraw-architect: command not found`로 죽어 CLI 폴백으로 그려졌다. 원인은 Codex가 MCP 서버를 cwd=플러그인 루트(레포 사본, `package.json` name이 npm 패키지와 동일)로 띄우고 npx가 그걸 로컬 프로젝트로 잡는 것. shim에 MCP 모드 `cd /`를 넣어 고쳤고 같은 조건에서 `initialize` 응답을 확인했지만, **실제 Codex 세션으로는 아직 재시험 안 했다.** 사용자는 이 수정이 "치팅 아니냐"고 물었고, 정석 대안 B(플러그인 루트를 `plugin/` 하위 폴더로 분리해 복사본에 `package.json`이 안 들어가게)를 설명했다. **B를 할지·언제 할지는 다음 세션에서 사용자와 결정** — 그릴 대상.

**Current Progress** (git 기준, 작업 트리 깨끗, `origin/main`보다 3커밋 앞섬 — `53a8e8e`·`3078ff0` 포함, push는 지시 있을 때만):
- ✅ 핸드오프 1의 Q1~Q3 결정·반영 — `ee05201`, `3e016d1`
- ✅ npm `excalidraw-architect@0.1.0` 게시(사람, 계정 `leejuo`) — `6e7ad85`에 기록
- ✅ Claude 플러그인 채널 인수 통과(MCP 툴 경로, 스크린샷 확인) — `992e6b6`
- ✅ Codex 카탈로그 `.agents/plugins/marketplace.json`을 생성기 6번째 매니페스트로 추가, `.gitignore` 예외, README 설치 명령 교체 — `53a8e8e`
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

