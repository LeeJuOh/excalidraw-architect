---
status: accepted
---

# 그리기 규격은 서버 md 한 벌을 MCP `instructions`·`resources`로 전달하고, 가이드 툴은 지운다

업스트림은 치수·색·바인딩 규격을 `src/core/design-guide.ts` 문자열(MCP 툴 `read_diagram_guide`)과 스킬 문서 두 곳에 적어 값이 이미 어긋나 있었다. 원본을 서버 패키지 `docs/canvas-guide.md` 하나로 두고, 서버가 시작 시 읽어 initialize `instructions`(2KB 이내 요약)와 리소스 `guide://canvas`(전문)로 내보낸다. 스킬은 규격을 복사하지 않고 그 리소스를 가리키며, 툴은 지운다. 스킬 없이 MCP 서버만 등록한 사용자도 접속만으로 규격을 받게 하려는 결정이다. MCP 스펙이 "서버 사용법"의 자리로 `instructions`를, 문서의 자리로 `resources`를 정했고, 공식 reference 서버(everything)·GitHub MCP가 같은 방식을 쓴다. Claude Code는 `instructions`·툴 설명을 각 2KB에서 자르고 Codex는 앞 512자를 핵심으로 보라 하므로 요약을 그 안에 맞춘다. 근거: [`docs/research/2026-09-19-mcp-guidance-delivery.md`](../research/2026-09-19-mcp-guidance-delivery.md).

## Considered Options

- 툴을 남기고 서버가 스킬 폴더의 md를 읽어 돌려주기: 서버는 npm으로 따로 배포돼 스킬 경로를 알 수 없고, 서버→스킬 의존이 생겨 기각했다.
- drawio-mcp처럼 툴 description에 전문을 붙이기: Claude Code가 2KB에서 자르고, 툴 검색 기본값에선 description이 검색 후에야 보여 기각했다.
- 툴을 지우고 스킬 문서만 원본으로 두기: MCP-only 사용자가 규격을 못 받아 기각했다.

## Consequences

- 서버 코드 변경 3곳(md 로딩·`instructions`·`resources` 등록)과 툴 삭제 3곳. 업스트림 머지 시 `read_diagram_guide`가 되살아나면 다시 지운다.
- Codex가 `instructions`를 시스템 프롬프트에 넣는지는 문서에 없다. 이슈 01 설치 확인 때 실측한다.
