---
status: accepted
---

# 스킬 본문은 MCP prompt `archdraw`로, 참고 문서는 resource로 전달하고 원본은 스킬 폴더 한 벌이다

플러그인 없이 MCP 서버만 등록한 사용자는 툴과 캔버스 규격([ADR-0006](0006-canvas-guide-single-source-via-mcp.md))만 받는다. archdraw 판단, 곧 상황 라우팅·줌 레벨·캔버스 우선은 받지 못한다. 그래서 서버가 MCP prompt `archdraw`로 스킬 본문(SKILL.md, frontmatter 제외)을 돌려주고, 스킬의 `references/*.md`를 resource로 연다. 서버는 사본을 두지 않고, 호출될 때 자기 패키지 안의 스킬 폴더를 읽는다. npm 패키지에는 스킬 폴더가 이미 들어 있다(`files`의 `plugin/**`, 필수 파일 검사가 확인). 그래서 플러그인 경로와 MCP 직접 등록 경로가 같은 판단을 받는다. skill과 MCP를 함께 내는 참고 레포(yctimlin·drawio-mcp·notebooklm-mcp-cli)는 모두 MCP 전용 경로를 정식으로 안내하고, drawio-mcp는 문서 하나를 스킬과 서버가 같이 쓴다(2026-09-24 조사).

## Considered Options

- 판단 본문을 `instructions`에 넣기: Claude Code가 2KB에서 자른다(`docs/research/2026-09-19-mcp-guidance-delivery.md`). 본문은 300줄 가까이 된다.
- 서버 안에 스킬 사본 두기: 두 벌이 어긋난다. 업스트림 규격이 두 곳에서 어긋났던 것과 같은 문제다(ADR-0006).
- MCP 직접 등록은 지원하지 않기: yctimlin 사용자층이 이 경로로 들어오고, 플러그인 시스템이 없는 호스트(Claude Desktop·Cursor)는 이 경로밖에 없다.

## Consequences

- ADR-0006이 기각한 "서버가 스킬 폴더의 md를 읽기"의 전제("서버는 스킬 경로를 알 수 없다")는 [ADR-0011](0011-plugin-lives-under-plugin-dir.md) 이후 패키지가 스킬 폴더를 싣게 되면서 사라졌다. 이제 서버는 스킬 폴더에 의존하므로, 스킬 폴더의 위치나 파일 이름을 바꾸면 서버도 같이 고쳐야 한다. 필수 파일 검사가 그 목록을 지킨다.
- prompt 이름 `archdraw`는 README에 적히는 공개 이름이다. 바꾸면 사용자가 부르던 이름이 사라진다.
- 스킬 본문의 참고 문서 링크는 상대경로라 prompt로 받으면 열리지 않는다. 본문에 같은 문서를 resource로도 읽을 수 있다고 한 줄 둔다.
- 미확인: Claude Desktop·Cursor에서 prompt가 어떻게 보이는지, 모델이 resource를 스스로 읽는지.
