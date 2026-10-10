# excalidraw-architect

## 프로젝트 목적과 접근

개발자와 에이전트가 **같은 그림을 보고 고치며 공통의 이해를 만든다** — 그림이 유비쿼터스 언어 역할을 한다.
개발자는 아키텍처·책임 경계·트레이드오프를 결정하고 구현을 위임한다. 기능 판단은 개발자를 설계에 계속 참여시키는 쪽으로 한다.

> yctimlin `mcp_excalidraw`(MIT) 포크 — `git remote upstream`. 서버도 고쳐 쓰고 내장 스킬은 `archdraw`로 바꾼 Claude Code / Codex 플러그인. 업스트림과 달라진 결정은 `docs/adr/`.

## 이 파일

맵이다 — 레포로 알 수 없는 규약·포인터·gotcha만. 상세는 `docs/`에 두고 가리킨다. 고칠 땐 이 파일을 고친다(`CLAUDE.md`는 import 한 줄).

## 문서 위치

| 언제 | 무엇 | 어디 |
|---|---|---|
| 구현 착수 전 | 스펙(PRD)과 구현 순서 표, 이슈 티켓 | `.scratch/<feature-slug>/` |
| 이슈 파일을 만들거나 `Status:`를 바꿀 때 | 티켓 파일 규약, 라벨 문자열 5종 | `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md` |
| 코드 탐색 전 | 용어·결정 기록 읽는 순서, 용어 준수·ADR 충돌 규칙 | `docs/agents/domain.md` → `CONTEXT.md`, `docs/adr/` |
| 업스트림을 머지한 뒤 | 되살아나면 다시 지울 파일·설정 목록 | `docs/agents/upstream-merge.md` |

## 지식 소스 — 심링크 3종 (읽기 전용)

개념·패턴·도구의 근거가 필요할 때, 사전 지식으로 답하기 전에 `wiki/index.md`부터 찾는다.

```
wiki          -> ../llm-wiki/wiki          # LLM 증류 지식 페이지. 1차 진입점: wiki/index.md
raw-articles  -> ../llm-wiki/raw/articles  # 원문 클립. 정확한 인용·수치 필요할 때만
references    -> ../references             # 외부 레포 클론 24GB. 최후에, 좁혀서만
```

sibling 레포 소유라 읽기만 한다. git에는 심링크째로 들어가 GitHub에선 깨진 링크로 보인다 — 정상. 절대경로 대신 위 심링크 이름으로 읽는다 — 레포 밖 경로는 호출마다 승인을 묻는다.

**`references/`는 24GB.** `ls references/ | grep <키워드>` → README → 하위 순으로 좁혀 들어가고, 넓은 탐색은 서브에이전트에 맡긴다. 레포 전체 `grep -r`/`find`는 금지.
포크 근거 원문 사본: `references/mcp-excalidraw-yctimlin/`(업스트림 스냅샷), `references/excalidraw-diagram-skill/`(라이선스 없음 — 아이디어만 가져오고 문장은 새로 쓴다), `references/archify/`(MIT).

## Gotchas

- 파일 생성·수정은 Write/Edit 도구로 한다.
- 플러그인에 들어갈 파일은 `plugin/` 아래에 둔다 — 호스트는 카탈로그가 가리키는 그 폴더만 복사한다(ADR-0011).
- 매니페스트와 스킬 shim은 **생성물이다.** `package.json`을 고치고 `npm run manifests`로 재생성한다. `npm test`·CI가 드리프트와 shim 실행 권한을 검사한다.
- `gh`는 기본 레포를 `upstream`(yctimlin)으로 잡는다. 새 클론마다 `gh repo set-default LeeJuOh/excalidraw-architect`. 이슈·라벨 작업 전 `gh repo view`로 확인.
- 서버 코드 변경 확인은 `npm run build` 후 `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트(claude/codex)를 시작한다. 비어 있으면 shim이 npm 게시본을 `npx`로 띄워 방금 고친 코드가 돌지 않는다. 스킬 텍스트만 고칠 땐 불필요.
- npm 게시본은 shim(`plugin/skills/archdraw/scripts/archdraw`)으로 검증한다. 레포 안에서 맨 `npx excalidraw-architect`는 같은 이름의 로컬 패키지로 잡혀 `command not found`가 난다(ADR-0011).

## 문제를 설명할 때

사용자가 한 번에 이해하고 판단할 수 있게, 이 순서로 말한다.

1. **현상** — 사용자가 무엇을 하면 무엇을 보는지, 한두 문장. Q번호·별명 대신 현상을 쓴다.
2. **예시** — 코드·실행으로 확인한 실제 예시 하나를 번호 단계로. 단계마다 주어는 컴포넌트 하나:
   사용자 · 에이전트 · MCP 프로세스(`src/core/`) · 캔버스 서버(`src/server.ts`, 별도 프로세스) · 브라우저 탭(`frontend/src/App.tsx`, 둘 이상이면 탭 A·탭 B).
   컴포넌트를 넘는 단계는 `보내는 쪽 → 받는 쪽: 무엇`. 확인하지 않은 단계는 `(미확인)`.
3. **영향** — 사용자가 잃는 것과 푸는 방법.
4. **원인** — 예시의 몇 번 단계가 문제인지.
5. 사용자가 이해했다고 답하면 **결정 질문**.

- 동작은 실제 이름(메시지, 함수, 값)으로 쓴다.
- 줄일 때는 1~4 밖의 말을 줄인다.

## 커밋

영어 1~2문장, 트레일러 없음(`Co-Authored-By` 포함). push는 지시 있을 때만.
