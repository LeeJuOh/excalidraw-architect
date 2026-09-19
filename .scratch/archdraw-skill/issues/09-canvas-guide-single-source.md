# 09: 그리기 규격 단일 원본 — 서버 md 한 벌을 MCP `instructions`·`resources`로

> 결정: [ADR-0006](../../../docs/adr/0006-canvas-guide-single-source-via-mcp.md). 근거·상한 출처: [`docs/research/2026-09-19-mcp-guidance-delivery.md`](../../../docs/research/2026-09-19-mcp-guidance-delivery.md). 2026-09-19 03에서 분리.

**What to build:** 스킬 없이 MCP 서버만 등록한 에이전트도 접속만으로 치수·색·바인딩 규격의 핵심을 받고, 전문이 필요하면 리소스 하나를 읽는다. 스킬을 쓰는 에이전트도 같은 리소스를 읽는다. 규격 원본은 서버 패키지 안 md 파일 하나이며 코드 문자열·스킬 문서에 사본이 없다. 업스트림의 가이드 툴은 사라진다.

- 원본은 서버 패키지 안 md 파일 하나. npm 게시본과 로컬 빌드 양쪽에서 서버가 시작 시 그 파일을 읽는다 — `package.json` `files`에 md가 포함되고, 경로는 `dist/`에서 실행될 때와 npx로 받은 패키지에서 실행될 때 모두 맞아야 한다. 파일이 없으면 시작 실패를 로그로 알린다(조용히 빈 규격으로 뜨지 않는다).
- 내용 범위: 색 팔레트, 최소 크기·간격 등 치수, 화살표 바인딩 규약(바인딩 ID·`fillStyle` 등 툴 파라미터 규약 포함), 그리기 순서, 안티패턴. 업스트림 `design-guide.ts`의 "Diagram Type Templates"(architecture·flowchart·ER)는 넣지 않는다 — 그림 종류는 03 라우팅 표 담당. 선 표기는 PRD §3 "선 표기"로 교체한다(dashed = async/optional/event 규칙 제거, 점선은 확인되지 않음 전용).
- 전달 1 — initialize `instructions`: md에서 뽑은 요약. 앞 512자에 바인딩 필수·최소 크기·간격 핵심을 자립형으로, 전체 2KB 이내, 끝에 "전문은 리소스 `guide://canvas`" 한 줄. Claude Code는 2KB에서 자르고 Codex는 앞 512자를 핵심으로 본다. 요약은 md 안의 표시된 절(예: 첫 절)을 그대로 쓰거나 빌드 시 생성하되, 손으로 두 벌 유지하지 않는다.
- 전달 2 — 리소스 `guide://canvas`: md 전문. `resources` capability를 켜고 `resources/list`·`resources/read`에 응답한다.
- 삭제: `read_diagram_guide` 툴(등록·디스패치·상태 판정 세 곳)과 `design-guide.ts`의 규격 문자열. 업스트림 머지 시 되살아나면 다시 지운다(AGENTS.md gotcha에 추가).
- 스킬 몫(03에서 수행): SKILL.md·`references/canvas-ops.md`는 규격 값을 적지 않고 "그리기 전 리소스 `guide://canvas`를 읽는다"로 가리킨다. 이 이슈는 서버 쪽만 다룬다.
- 로컬 확인은 `npm run build` 후 `ARCHDRAW_BIN`을 두고 한다(AGENTS.md gotcha).

**Blocked by:** 01 (플러그인 골격 — npm 패키지 이름·`files`·게시 경로가 정해져야 md 동봉 경로를 확정)

**Status:** ready-for-agent

- [ ] `npm pack` 산출물(tarball) 안에 규격 md가 들어 있고, 그 tarball을 설치해 띄운 서버가 md를 읽어 뜬다
- [ ] `initialize` 응답의 `instructions`가 2KB 이내이고, 앞 512자만 잘라 읽어도 바인딩 필수·최소 크기·간격이 들어 있으며, 끝에 `guide://canvas` 안내가 있다
- [ ] `resources/list`에 `guide://canvas`가 있고 `resources/read` 결과 본문이 md 파일 내용과 바이트 단위로 같다
- [ ] `tools/list`에 `read_diagram_guide`가 없고, 레포에서 `design-guide` 문자열 상수가 사라졌다
- [ ] md에 "Diagram Type Templates" 절이 없고, dashed = async/optional/event 규칙이 없으며, PRD §3 선 표기가 들어 있다
- [ ] md를 지우고 서버를 띄우면 시작 실패 원인이 로그에 나온다
- [ ] Claude Code에 서버를 등록하면 세션 시스템 프롬프트의 MCP 지침 블록에 요약이 보인다. Codex에서는 `instructions`가 어디에 실리는지 01 설치 확인 때 함께 실측해 결과를 이 이슈 Comments에 남긴다
