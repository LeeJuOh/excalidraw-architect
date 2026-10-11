# 10: MCP만 등록해도 archdraw 판단을 받는다

> 결정: [ADR-0014](../../../docs/adr/0014-skill-body-as-mcp-prompt.md). 스펙: 7-10, 7-7, 스토리 36~40, Testing Decisions. 2026-09-24 01 사후 검수 중 분리. 2026-10-12 구현 전 검수(codex verify)로 resource 이름·README 버전·실패 시점을 정함.

**What to build:** 플러그인 없이 MCP 서버만 등록한 사용자(Claude Desktop·Cursor 등, 또는 `claude mcp add`)가 README 명령 한 줄로 서버를 붙이고, MCP prompt `archdraw`를 부르면 archdraw 판단 본문을 받는다. 본문이 가리키는 참고 문서(상황 목차와 상황별 문서·줌 레벨·조작법 등 `references/` 아래의 문서 전부, 하위 폴더 포함)는 MCP resource로 읽힌다. 원본은 스킬 폴더 한 벌이고, 서버는 시작할 때 자기 패키지 안의 스킬 폴더를 읽는다. 등록한 폴더가 이 레포여도 서버가 뜬다.

- prompt 본문은 SKILL.md에서 frontmatter를 뺀 것이다. 서버는 사본을 두지 않는다.
- **참고 문서 resource의 이름은 `guide://` + 스킬 폴더 기준 상대경로다.** 예: `references/situations/saga.md` → `guide://references/situations/saga.md`. 모델은 본문 링크 경로 앞에 `guide://`만 붙여 읽는다. 상황별 문서 안의 `../routing-table.md` 같은 상대 링크도 URL 규칙으로 같은 이름 체계에 풀린다. 이유: MCP SDK는 resource 이름을 URL로 해석해 상대경로를 받지 못하고, 설치 위치를 담은 `file://` 절대경로는 기기·버전마다 달라 본문에 고정 규칙을 적을 수 없다. 파일을 여는 쪽은 서버다 — 서버는 자기 패키지 위치를 안다.
- 참고 문서 resource는 캔버스 규격 resource(`guide://canvas`)와 같은 방식(서버가 원본 md를 읽어 등록, 목록·읽기 지원)이다. 목록 항목은 이름과 제목(파일의 첫 `#` 줄)만 갖고 설명은 두지 않는다 — 라우팅은 routing-table이 한다.
- 서버는 시작할 때 `references/`를 하위 폴더까지 훑어 목록을 만든다. 문서의 개수를 코드에 고정하지 않는다(2026-10-04). 읽기 요청은 이 목록에 있는 이름만 받고, 목록에 없는 이름(`..` 포함)은 에러다.
- **스킬 폴더 파일(SKILL.md 또는 `references/`)이 패키지에 없으면 서버가 시작하지 않는다.** 캔버스 규격 md가 없을 때와 같다(09). 조용히 빈 본문을 돌려주지 않는다.
- README 두 언어에 MCP 직접 등록 절차를 적는다. 명령은 `npx --prefix ~ -y excalidraw-architect@latest`를 쓴다 — `--prefix ~`는 등록한 폴더의 같은 이름 `package.json`을 피하고(01 사후 검수 5), `@latest`는 MCP 직접 등록 사용자에게 다른 업데이트 채널이 없어서다. 등록 뒤 prompt `archdraw`를 부른다고 적는다.
- SKILL.md에 한 줄을 둔다: 참고 문서 링크가 열리지 않으면(prompt로 받은 경우) 링크 경로 앞에 `guide://`를 붙여 resource로 읽는다. 줄 수 예산은 `test:skill-docs`가 지킨다.
- SKILL.md의 "MCP 툴이 있으면" 분기는 MCP 직접 등록 사용자에게 MCP 경로로 읽힌다(스펙 7-10에서 결정됨). 문구는 고치지 않는다.
- 로컬 확인은 `npm run build` 후 `ARCHDRAW_BIN`을 두고 한다(AGENTS.md gotcha).

**Blocked by:** 03 슬라이스 C — 완료(03의 슬라이스 C 문서 기준 항목 전부 체크, `references/situations/` 존재, 스펙 구현 순서 표 "착수 가능").

**Status:** resolved (2026-10-12 — 에이전트 칸 전부 통과. 다음 릴리즈 뒤 사람이 확인: 레포 밖 폴더와 이 레포 폴더에서 README 명령으로 등록)

**완료 규칙:** 아래 에이전트 칸이 모두 통과하면 resolved로 닫고, 손 확인 칸은 Status에 "다음 릴리즈 뒤 사람이 확인"으로 남긴다(01과 같은 방식).

**테스트 경계(합의됨):** 기존 MCP stdio 와이어 테스트. 새 시임은 없다. 본문 문장은 검사하지 않는다.

- [x] 서버에 붙어 prompt 목록에 `archdraw`가 있고, 받으면 스킬 본문이 온다(frontmatter 없음)
- [x] resource 목록이 테스트가 직접 훑은 스킬 `references/` 아래 파일 목록(하위 폴더 포함)과 정확히 같고(`guide://` + 상대경로), 각각 읽으면 그 파일 내용이 온다. `guide://canvas`도 그대로 있다
- [x] 목록에 없는 이름(예: `guide://references/../SKILL.md`)을 읽으면 에러다
- [x] `npm pack` 산출물을 설치해 띄운 서버에서도 prompt와 resource가 동작한다
- [x] README 두 언어에 MCP 직접 등록 명령(`--prefix ~`, `@latest` 포함)과 prompt 호출 안내가 있다
- [x] `npm test` 통과
- [ ] 손 확인: 레포 밖 폴더와 이 레포 폴더에서 각각 README 명령으로 등록해 서버가 붙는다(게시본이 필요하므로 다음 릴리즈 뒤)

02에서 관찰(이 티켓의 구현 판단이 아님, 스펙 7-10 "미확인"): Claude Desktop·Cursor에서 prompt가 어떻게 보이고 불리는지, 모델이 resource를 스스로 읽는지.

## Comments

**2026-10-12 — 구현 완료.**

- `src/core/skill-guide.ts`가 시작할 때 `plugin/skills/archdraw/`의 SKILL.md와 `references/` 아래 파일 전부(하위 폴더 포함)를 읽는다. `canvas-guide.ts`와 같은 구조다. `runServer()`가 두 파일 묶음을 모두 읽어, 없으면 시작이 실패한다.
- 목록에 없는 이름의 에러는 SDK가 낸다(정적 등록만 하므로 `ResourceNotFoundError`). 추가 코드는 없다.
- 와이어 검사 4개 추가(`scripts/check-mcp-stdio.mjs`): prompt 본문, resource 목록·읽기, 목록 밖 이름, 스킬 폴더 없을 때 시작 실패.
- tarball 확인은 레포 밖에서 했다: `npm pack` → 임시 프로젝트에 설치 → prompt 본문, resource 28개(참고 문서 27 + `guide://canvas`), saga 읽기가 동작했다.
- SKILL.md 줄은 문서 안 상대 링크 규칙도 적었다. 처음 문장("링크 경로 앞에 `guide://`")만으로는 `routing-table.md` 안의 `situations/saga.md`가 `guide://situations/saga.md`로 틀리게 풀린다.
- 미확인: README의 Claude Code prompt 호출 형식 `/mcp__archdraw__archdraw`는 Claude Code 문서의 MCP prompt 명명 규칙을 따랐고, 실제 호출은 손 확인 때 본다.
