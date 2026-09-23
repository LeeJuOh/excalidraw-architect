# 10: MCP만 등록해도 archdraw 판단을 받는다

> 결정: [ADR-0014](../../../docs/adr/0014-skill-body-as-mcp-prompt.md). 스펙: 7-10, 7-7, 스토리 36~40, Testing Decisions. 2026-09-24 01 사후 검수 중 분리.

**What to build:** 플러그인 없이 MCP 서버만 등록한 사용자(Claude Desktop·Cursor 등, 또는 `claude mcp add`)가 README 명령 한 줄로 서버를 붙이고, MCP prompt `archdraw`를 부르면 archdraw 판단 본문을 받는다. 본문이 가리키는 참고 문서(라우팅 표·줌 레벨·조작법)는 MCP resource로 읽힌다. 원본은 스킬 폴더 한 벌이고, 서버는 호출될 때 자기 패키지 안의 스킬 폴더를 읽는다. 등록한 폴더가 이 레포여도 서버가 뜬다.

- prompt 본문은 SKILL.md에서 frontmatter를 뺀 것이다. 서버는 사본을 두지 않는다.
- 참고 문서 resource는 캔버스 규격 resource(`guide://canvas`)와 같은 방식으로 목록·읽기를 지원한다.
- 스킬 폴더 파일이 패키지에 없으면 조용히 빈 본문을 돌려주지 않고 실패를 알린다. 캔버스 규격 md를 읽을 때와 같다(09).
- README 두 언어에 MCP 직접 등록 절차를 적는다. 명령의 npx에 `--prefix ~`를 넣고, 등록 뒤 prompt `archdraw`를 부른다고 적는다.
- SKILL.md에 참고 문서를 resource로도 읽을 수 있다는 한 줄을 둔다(상대경로 링크는 prompt로 받으면 열리지 않음). 줄 수 예산은 `test:skill-docs`가 지킨다.
- 로컬 확인은 `npm run build` 후 `ARCHDRAW_BIN`을 두고 한다(AGENTS.md gotcha).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**테스트 경계(합의됨):** 기존 MCP stdio 와이어 테스트. 새 시임은 없다. 본문 문장은 검사하지 않는다.

- [ ] 서버에 붙어 prompt 목록에 `archdraw`가 있고, 받으면 스킬 본문이 온다(frontmatter 없음)
- [ ] resource 목록에 참고 문서 3개가 있고 각각 읽힌다. `guide://canvas`도 그대로 있다
- [ ] `npm pack` 산출물을 설치해 띄운 서버에서도 prompt와 resource가 동작한다
- [ ] README 두 언어에 MCP 직접 등록 명령(`--prefix ~` 포함)과 prompt 호출 안내가 있다
- [ ] 손 확인: 레포 밖 폴더와 이 레포 폴더에서 각각 README 명령으로 등록해 서버가 붙는다(게시본이 필요하므로 다음 릴리즈 뒤)
- [ ] `npm test` 통과

미확인(02에서 관찰): Claude Desktop·Cursor에서 prompt가 어떻게 보이고 불리는지, 모델이 resource를 스스로 읽는지, SKILL.md의 "MCP 툴이 있으면" 분기가 MCP 직접 등록 사용자에게 어떻게 읽히는지.
