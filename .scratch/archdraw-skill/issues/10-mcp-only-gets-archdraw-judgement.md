# 10: MCP만 등록해도 archdraw 판단을 받는다

> 결정: [ADR-0014](../../../docs/adr/0014-skill-body-as-mcp-prompt.md). 스펙: 7-10, 7-7, 스토리 36~40, Testing Decisions. 2026-09-24 01 사후 검수 중 분리. 2026-10-12 구현 전 검수(codex verify)로 resource 이름·README 버전·실패 시점을 정함.

**What to build:** 플러그인 없이 MCP 서버만 등록한 사용자(Claude Desktop·Cursor 등, 또는 `claude mcp add`)가 README 명령 한 줄로 서버를 붙이고, MCP prompt `archdraw`를 부르면 archdraw 판단 본문을 받는다. 본문이 가리키는 참고 문서(상황 목차와 상황별 문서·줌 레벨·조작법 등 `references/` 아래의 문서 전부, 하위 폴더 포함)는 MCP resource로 읽힌다. 원본은 스킬 폴더 한 벌이고, 서버는 시작할 때 자기 패키지 안의 스킬 폴더를 읽는다. 등록한 폴더가 이 레포여도 서버가 뜬다.

- prompt 본문은 SKILL.md에서 frontmatter를 뺀 것이다. 서버는 사본을 두지 않는다.
- **참고 문서 resource의 이름은 `guide://` + 스킬 폴더 기준 상대경로다.** 예: `references/situations/saga.md` → `guide://references/situations/saga.md`. 모델은 본문 링크 경로 앞에 `guide://`만 붙여 읽는다. 상황별 문서 안의 `../routing-table.md` 같은 상대 링크도 URL 규칙으로 같은 이름 체계에 풀린다. 이유: MCP SDK는 resource 이름을 URL로 해석해 상대경로를 받지 못하고, 설치 위치를 담은 `file://` 절대경로는 기기·버전마다 달라 본문에 고정 규칙을 적을 수 없다. 파일을 여는 쪽은 서버다 — 서버는 자기 패키지 위치를 안다.
- 참고 문서 resource는 캔버스 규격 resource(`guide://canvas`)와 같은 방식(서버가 원본 md를 읽어 등록, 목록·읽기 지원)이다. 목록 항목은 이름과 제목(파일의 첫 `#` 줄)만 갖고 설명은 두지 않는다 — 라우팅은 routing-table이 한다.
- 서버는 시작할 때 `references/`를 하위 폴더까지 훑어 목록을 만든다. 문서의 개수를 코드에 고정하지 않는다(2026-10-04). 읽기 요청은 이 목록에 있는 이름만 받고, 목록에 없는 이름(`..` 포함)은 에러다.
- **스킬 폴더 파일(SKILL.md 또는 `references/`)이 패키지에 없으면 서버가 시작하지 않는다.** 캔버스 규격 md가 없을 때와 같다(09). 조용히 빈 본문을 돌려주지 않는다.
- README 두 언어에 MCP 직접 등록 절차를 적는다. 명령은 `npx -y excalidraw-architect@latest`를 쓴다(2026-10-12 수정: `--prefix ~`를 뺐다 — 아래 Comments). `@latest`는 MCP 직접 등록 사용자에게 다른 업데이트 채널이 없어서다. 등록 뒤 prompt `archdraw`를 부른다고 적는다.
- SKILL.md에 한 줄을 둔다: 참고 문서 링크가 열리지 않으면(prompt로 받은 경우) 링크 경로 앞에 `guide://`를 붙여 resource로 읽는다. 줄 수 예산은 `test:skill-docs`가 지킨다.
- SKILL.md의 "MCP 툴이 있으면" 분기는 MCP 직접 등록 사용자에게 MCP 경로로 읽힌다(스펙 7-10에서 결정됨). 문구는 고치지 않는다.
- 로컬 확인은 `npm run build` 후 `ARCHDRAW_BIN`을 두고 한다(AGENTS.md gotcha).

**Blocked by:** 03 슬라이스 C — 완료(03의 슬라이스 C 문서 기준 항목 전부 체크, `references/situations/` 존재, 스펙 구현 순서 표 "착수 가능").

**Status:** resolved (2026-10-12 — 모든 칸 통과. 손 확인은 v0.2.0 게시본으로 했다)

**완료 규칙:** 아래 에이전트 칸이 모두 통과하면 resolved로 닫고, 손 확인 칸은 Status에 "다음 릴리즈 뒤 사람이 확인"으로 남긴다(01과 같은 방식).

**테스트 경계(합의됨):** 기존 MCP stdio 와이어 테스트. 새 시임은 없다. 본문 문장은 검사하지 않는다.

- [x] 서버에 붙어 prompt 목록에 `archdraw`가 있고, 받으면 스킬 본문이 온다(frontmatter 없음)
- [x] resource 목록이 테스트가 직접 훑은 스킬 `references/` 아래 파일 목록(하위 폴더 포함)과 정확히 같고(`guide://` + 상대경로), 각각 읽으면 그 파일 내용이 온다. `guide://canvas`도 그대로 있다
- [x] 목록에 없는 이름(예: `guide://references/../SKILL.md`)을 읽으면 에러다
- [x] `npm pack` 산출물을 설치해 띄운 서버에서도 prompt와 resource가 동작한다
- [x] README 두 언어에 MCP 직접 등록 명령(`@latest` 포함)과 prompt 호출 안내가 있다
- [x] `npm test` 통과
- [x] 손 확인: 레포 밖 폴더와 이 레포 폴더에서 각각 등록해 서버가 붙는다(v0.2.0, 2026-10-12)

02에서 관찰(이 티켓의 구현 판단이 아님, 스펙 7-10 "미확인"): Claude Desktop·Cursor에서 prompt가 어떻게 보이고 불리는지, 모델이 resource를 스스로 읽는지.

## Comments

**2026-10-12 — 구현 완료.**

- `src/core/skill-guide.ts`가 시작할 때 `plugin/skills/archdraw/`의 SKILL.md와 `references/` 아래 파일 전부(하위 폴더 포함)를 읽는다. `canvas-guide.ts`와 같은 구조다. `runServer()`가 두 파일 묶음을 모두 읽어, 없으면 시작이 실패한다.
- 목록에 없는 이름의 에러는 SDK가 낸다(정적 등록만 하므로 `ResourceNotFoundError`). 추가 코드는 없다.
- 와이어 검사 4개 추가(`scripts/check-mcp-stdio.mjs`): prompt 본문, resource 목록·읽기, 목록 밖 이름, 스킬 폴더 없을 때 시작 실패.
- tarball 확인은 레포 밖에서 했다: `npm pack` → 임시 프로젝트에 설치 → prompt 본문, resource 28개(참고 문서 27 + `guide://canvas`), saga 읽기가 동작했다.
- SKILL.md 줄은 문서 안 상대 링크 규칙도 적었다. 처음 문장("링크 경로 앞에 `guide://`")만으로는 `routing-table.md` 안의 `situations/saga.md`가 `guide://situations/saga.md`로 틀리게 풀린다.
- 미확인: README의 Claude Code prompt 호출 형식 `/mcp__archdraw__archdraw`는 Claude Code 문서의 MCP prompt 명명 규칙을 따랐고, 실제 호출은 손 확인 때 본다.

**2026-10-12 — 손 확인 통과, README 명령 수정.**

- v0.2.0 게시본을 Claude Code에 `claude mcp add archdraw -- npx --prefix ~ -y excalidraw-architect@latest`로 등록했다. 레포 밖 폴더와 이 레포 폴더 모두 `✔ Connected`였다. `claude -p "/mcp__archdraw__archdraw"`의 세션 기록에 스킬 본문(16.5KB, `# archdraw`로 시작, frontmatter 없음)이 들어왔다. README의 호출 이름 `/mcp__archdraw__archdraw`가 맞다.
- 결함: `--prefix ~`는 JSON 설정으로 등록하는 호스트(Claude Desktop·Cursor)에서 깨진다. 셸이 없어 `~`가 글자 그대로 npm에 가고 `npm error ENOENT ... lstat '<cwd>/~'`(종료 코드 254)로 죽는다. 셸 없이 args 배열로 재현했다. Claude Desktop 자체에서는 미확인.
- 수정: README 두 언어의 명령을 `npx -y excalidraw-architect@latest`로 바꿨다. 같은 이름 `package.json` 문제는 이 레포 폴더에서 등록하는 메인테이너에게만 생기므로 AGENTS.md gotcha로 옮겼다. 스펙 7-10도 고쳤다.

---

## 핸드오프 — v0.2.0 게시 뒤 손 확인 (2026-10-12)

### Goal

10의 마지막 칸(손 확인)을 닫는다. 게시본 0.2.0을 README 명령으로 등록하면 서버가 붙고, prompt `archdraw`를 부르면 스킬 본문이 온다.

### First Action

게시를 확인한다: `npm view excalidraw-architect version`이 `0.2.0`이어야 한다. 아니면 `gh run list -R LeeJuOh/excalidraw-architect --workflow npm-publish.yml -L 1`로 "Publish to NPM" 실행의 결과를 본다. 게시 직후 몇 분은 npm 검사("Validating") 때문에 안 보일 수 있다.

### Context

- 릴리즈는 스펙 7-5d 절차대로 했다: `npm version 0.2.0`(커밋 `cfa704f`, 태그 `v0.2.0`) → `git push --follow-tags` → `gh release create v0.2.0 -R LeeJuOh/excalidraw-architect --generate-notes`.
- 릴리즈를 만들 때 `b7aceef`의 CI는 아직 돌고 있었다. 게시 워크플로(`.github/workflows/npm-publish.yml`)가 게시 전에 `npm test`와 `check-pack-contents.mjs`를 다시 돌리므로 관문은 그대로다. 게시가 실패했다면 그 로그부터 본다.
- 버전은 0.2.0이다. 0.1.1 뒤로 세션·frame·저장·근거 검사·MCP prompt가 들어갔다.

### Current Progress (git 기준)

- `b7aceef` — 10 구현: `src/core/skill-guide.ts`(신규), `src/core/mcp-server.ts`, `src/index.ts`, `scripts/check-mcp-stdio.mjs`(와이어 검사 4개 추가), SKILL.md 3문장, README 두 언어, 이 이슈 파일(체크박스·Status·Comments).
- `7c88997` — 스펙 구현 순서 표와 목록에서 10을 완료로 표시.
- `cfa704f` — `0.2.0`: 매니페스트와 shim(`plugin/skills/archdraw/scripts/archdraw`)의 버전이 `0.2.0`.
- 커밋하지 않은 것: `tools/`(추적 안 됨). 이 세션의 작업이 아니다. 08 작업으로 보인다(미확인).

### Next Steps

1. **레포 밖 폴더에서 등록.** 빈 폴더에서 `claude mcp add archdraw -- npx --prefix ~ -y excalidraw-architect@latest` → `claude`를 켜 `/mcp`에서 archdraw가 connected인지 본다 → `/mcp__archdraw__archdraw`를 불러 SKILL.md 본문이 오는지 본다.
2. **이 레포 폴더에서 같은 등록.** 같은 이름의 로컬 `package.json`이 있어도 `--prefix ~` 덕분에 게시본이 붙는지 본다. 끝나면 `claude mcp remove archdraw`로 지운다.
3. **호출 형식 확인.** README의 `/mcp__archdraw__archdraw`는 Claude Code의 MCP prompt 명명 규칙을 따라 적었고 실제로 불러 보지 않았다. 다르면 README 두 언어를 고친다.
4. 둘 다 붙으면 위 마지막 체크박스를 체크하고 Status의 "다음 릴리즈 뒤 사람이 확인" 문구를 정리한다. 스펙 순서 목록 10번의 "손 확인 1건이 남았다"도 지운다.
5. 그 다음은 스펙 순서 11번: [08 기록 스킬](08-dogfooding-report-skill.md).

### Decisions Made

- 참고 문서 resource의 SDK `name`은 스킬 폴더 기준 상대경로, `title`은 파일의 첫 `#` 줄이다. URI는 티켓대로 `guide://` + 상대경로다.
- 목록 밖 이름 거부는 SDK의 정적 등록에 맡겼다(`ResourceNotFoundError`). 읽기는 메모리에서만 하므로 파일 시스템에 닿지 않는다.
- 빈 `references/` 폴더는 따로 막지 않았다. npm은 빈 폴더를 싣지 않으므로 게시본에서는 "폴더 없음 → 시작 실패"가 된다.

### What Didn't Work

- ⚠️ SKILL.md에 "링크 경로 앞에 `guide://`를 붙인다"만 적으면 참고 문서 안의 상대 링크가 틀리게 풀린다(`routing-table.md`의 `situations/saga.md` → `guide://situations/saga.md`). 그래서 "resource 이름 기준으로 웹 링크처럼 푼다" 문장과 예시를 더했다. 참고 문서의 링크 형태를 바꿀 때 이 규칙을 같이 본다.
- 과정: 끝 보고에 결정이 아닌 정리 항목을 "판단할 것"으로 올려 사용자가 혼란스러워했다. 결정 질문에는 사용자만 정할 수 있는 것만 올린다.
