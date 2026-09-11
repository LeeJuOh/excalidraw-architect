# excalidraw-architect

[English](README.md)

백엔드 개발자와 에이전트가 텍스트 대신 그림으로 아키텍처를 주고받게 하는 Claude Code / Codex 플러그인. 라이브 [Excalidraw](https://excalidraw.com) 캔버스 위에서 동작한다.

캔버스는 [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw)의 것이다. 에이전트가 그리고, 스크린샷으로 자기 그림을 보고, 사용자가 브라우저에서 고친 것을 읽는다. 이 포크가 더한 것은 **판단**이다. 어떤 질문이든 박스-화살표 컴포넌트 그림으로 흐르지 않도록, **무엇을 어떤 줌 레벨로 그릴지** 정하는 `archdraw` 스킬을 넣었다.

## 뭐가 다른가

- **상황 → 그림 라우팅.** "이 API 부르면 뭐가 일어나?"에는 시퀀스, "구조가 어떻게 돼?"에는 줌 레벨 그림. 재시도 정책에는 백오프 간격과 최대 횟수가 든 상태도 — 그게 없는 재시도 그림은 장식이다.
- **캔버스 우선.** 에이전트는 행동 전에 캔버스를 본다. 사용자가 옮긴 박스는 정답이고, 에이전트는 정렬만 다듬지 재배치하지 않는다.
- **줌 레벨 5개, 스택 무관.** 시스템 컨텍스트 → 배포 단위 → 모듈 경계 → 레이어 → 경계 타입. 각 그림은 윗 레벨 박스 하나의 확대다. C4에 없는 Gradle 멀티모듈·NestJS 모듈 칸이 있다.
- **기본은 안 남김.** 그림은 설명용이고, "저장해"라고 하면 도면으로 승격돼 레포에 export된다.

## 상태

PRD 단계. 판단 스킬 코드는 아직 0줄이고, 서버 코드는 업스트림 그대로다. 설치할 것이 없다.

## 업스트림

[yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw) (MIT) 포크. 캔버스 서버·CLI·MCP 툴은 업스트림 README를 본다. 원저작권 표기는 [LICENSE](LICENSE)에 그대로 둔다.

## 라이선스

MIT.
