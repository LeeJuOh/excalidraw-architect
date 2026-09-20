# excalidraw-architect

[English](README.md)

백엔드 개발자와 에이전트가 텍스트 대신 그림으로 아키텍처를 주고받게 해주는 Claude Code / Codex 플러그인입니다. 라이브 [Excalidraw](https://excalidraw.com) 캔버스 위에서 동작합니다.

캔버스는 [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw)의 것을 씁니다. 에이전트가 그림을 그리고, 스크린샷으로 자기 그림을 확인하고, 사용자가 브라우저에서 고친 내용을 읽습니다. 이 포크가 더한 것은 **판단**입니다. 어떤 질문이든 박스-화살표 컴포넌트 그림으로 흐르지 않도록, **무엇을 어떤 줌 레벨로 그릴지** 정하는 `archdraw` 스킬을 넣었습니다.

## 무엇이 다른가요

- **상황 → 그림 라우팅.** "이 API 부르면 뭐가 일어나?"에는 시퀀스를, "구조가 어떻게 돼?"에는 줌 레벨 그림을 그립니다. 재시도 정책에는 백오프 간격과 최대 횟수가 들어간 상태도를 그립니다. 그게 빠진 재시도 그림은 장식일 뿐이기 때문입니다.
- **캔버스 우선.** 에이전트는 행동하기 전에 캔버스를 먼저 봅니다. 사용자가 옮긴 박스는 정답으로 받아들이고, 정렬만 다듬을 뿐 재배치하지 않습니다.
- **줌 레벨 5개, 스택 무관.** 시스템 컨텍스트 → 배포 단위 → 모듈 경계 → 레이어 → 경계 타입 순서입니다. 각 그림은 윗 레벨 박스 하나를 확대한 것입니다. C4에는 없는 Gradle 멀티모듈·NestJS 모듈 칸이 따로 있습니다.
- **기본은 남기지 않습니다.** 그림은 설명용이고, "저장해"라고 말하면 도면으로 승격되어 레포에 export됩니다.

## 설치

채널은 셋, 스킬 폴더는 하나입니다. 플러그인 두 채널은 MCP 서버를 등록해 에이전트가 MCP 툴로 캔버스를 다루고, `npx skills add`는 스킬만 복사하므로 내장 CLI shim으로 폴백합니다.

| 채널 | 설치 | 부르는 법 |
|---|---|---|
| Claude Code 플러그인 | `/plugin marketplace add LeeJuOh/excalidraw-architect` 후 `/plugin install excalidraw-architect@excalidraw-architect` | `/excalidraw-architect:archdraw <그려줬으면 하는 것>` — 이름이 겹치지 않으면 `/archdraw` |
| Codex 플러그인 | `codex plugin marketplace add LeeJuOh/excalidraw-architect` 후 `codex plugin add excalidraw-architect@excalidraw-architect` (`~/.codex/plugins`에 폴더만 두는 방식은 인식되지 않음) | `$excalidraw-architect:archdraw` 또는 `/skills`에서 선택. ChatGPT 데스크톱 Codex에서는 `@excalidraw-architect` 플러그인 선택 |
| 그 외 Agent Skills 호스트 | `npx skills add LeeJuOh/excalidraw-architect` | 해당 호스트의 스킬 호출 방식 |

이 스킬은 수동 전용입니다. 알아서 시작하지 않고, 사용자가 부른 뒤부터 그 대화에서 그림으로 답합니다.

**첫 실행에는 인터넷이 필요합니다.** 캔버스 서버는 이 레포에 들어 있지 않고 처음 그릴 때 npm에서 받아옵니다(`npx -y excalidraw-architect@<버전>`). 그래서 첫 명령은 느리고, 네트워크가 없으면 실패합니다 — 인터넷을 막는 Codex 기본 샌드박스도 여기에 해당합니다.

서버 코드를 직접 고치는 중이라면 `npm run build` 후 `ARCHDRAW_BIN=<레포>/dist/bin.js`가 있는 셸에서 `claude`/`codex`를 시작하세요. MCP 경로와 CLI 폴백 모두 게시본 대신 그 빌드를 씁니다.

## 업스트림

[yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw) (MIT)의 포크입니다. 캔버스 서버·CLI·MCP 툴 사용법은 업스트림 README를 참고해 주세요. 원저작권 표기는 [LICENSE](LICENSE)에 그대로 유지합니다.

## 라이선스

MIT
