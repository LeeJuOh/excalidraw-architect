# excalidraw-architect

## 프로젝트 목적과 접근

AI 에이전트와 개발할 때 개발자는 코드를 직접 보지 않고 에이전트의 말만 본다. 텍스트만으로는 서로 같은 도메인·구조·동작을 이해하고 있는지 확인하기 어렵다. 이 프로젝트는 개발자와 에이전트가 **같은 그림을 함께 보고 고치면서 공통의 이해를 만드는 것**을 목표로 한다. 도메인 모델링에서 유비쿼터스 언어를 맞추듯, 그림을 매개로 개념과 관계를 맞춘다.

개발자는 아키텍처·책임 경계·패턴·트레이드오프를 에이전트와 논의하고 결정하며, 합의한 설계의 세부 구현을 위임한다. 시각적 대화는 개발자가 설계에 계속 참여하도록 돕고, 구현과 이해 사이의 간극이 쌓이는 것을 줄인다.

이를 위해 yctimlin의 양방향 Excalidraw 캔버스를 기반으로, Excalidraw 스킬의 시각적 설명 방식과 archify의 설계 판단 원칙을 참고한다. 여기에 **백엔드 실무 질문에 맞는 그림 종류·줌 레벨·필수요소를 선택하는 `archdraw` 판단 스킬**을 더한다. 구조를 논의할 때는 구조를, 실패 처리를 논의할 때는 흐름과 상태를 함께 보도록 한다.

> yctimlin `mcp_excalidraw`(MIT) 포크 — `git remote upstream`. 서버 코드는 업스트림 것이고 내장 스킬만 `archdraw`로 바꾼 Claude Code / Codex 플러그인.

## 이 파일

맵이다. 레포를 봐서는 알 수 없는 것만 적는다 — 규약, 문서 포인터, gotcha. 상세는 `docs/`에 두고 여기서 가리킨다. `CLAUDE.md`는 `@AGENTS.md` 한 줄로 이 파일을 불러온다. 디렉터리는 첫 파일과 함께 만든다.

## 문서 위치

| 언제 | 무엇 | 어디 |
|---|---|---|
| 구현 착수 전 | 스펙(PRD)과 구현 순서 표, 이슈 티켓 | `.scratch/<feature-slug>/` — slug는 기능명. 현재 `archdraw-skill/spec.md`, `issues/` |
| 이슈 파일을 만들거나 `Status:`를 바꿀 때 | 티켓 파일 규약, 라벨 문자열 5종 | `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md` |
| 코드 탐색 전 | 용어 사전과 결정 기록 읽는 순서 | `docs/agents/domain.md` → `CONTEXT.md`, `docs/adr/` |

## 지식 소스 — 심링크 3종 (읽기 전용)

```
wiki          -> ../llm-wiki/wiki          # LLM 증류 지식 페이지. 1차 진입점: wiki/index.md
raw-articles  -> ../llm-wiki/raw/articles  # 원문 클립. 정확한 인용·수치 필요할 때만
references    -> ../references             # 외부 레포 클론 24GB. 최후에, 좁혀서만
```

sibling 레포 소유라 읽기만 한다. git에는 심링크째로 들어가 GitHub에선 깨진 링크로 보인다 — 정상. 절대경로 대신 위 심링크 이름으로 읽는다 — 레포 밖 경로는 호출마다 승인을 묻는다.

**`references/`는 24GB.** `ls references/ | grep <키워드>` → README → 하위 순으로 좁혀 들어가고, 넓은 탐색은 서브에이전트에 맡긴다. 레포 전체 `grep -r`/`find`는 금지.
포크 근거 원문 사본: `references/mcp-excalidraw-yctimlin/`(업스트림 스냅샷), `references/excalidraw-diagram-skill/`(라이선스 없음 — 아이디어만 가져오고 문장은 새로 쓴다), `references/archify/`(MIT).

## Gotchas

- 파일 생성·수정은 Write/Edit 도구로, Bash 한 호출에는 셸 구성 하나만. 히어독·`node -e`·반복문은 셸 파서가 분석하지 못해 호출마다 승인을 묻는다 — 여러 줄 스크립트는 `scripts/`에 커밋해 이름으로 부른다.
- 업스트림 머지 때 되살아나면 다시 지울 것: `.gitignore`의 `docs/` 무시 줄, `read_diagram_guide` 툴과 `design-guide.ts`(ADR-0006).
- 플러그인에 들어갈 파일은 `plugin/` 아래에 둔다 — 호스트는 카탈로그가 가리키는 그 폴더만 복사한다(ADR-0011).
- 매니페스트 6개와 스킬 shim은 **생성물이다.** `package.json`을 고치고 `npm run manifests`로 재생성한다. `npm test`·CI가 드리프트와 shim 실행 권한을 검사한다.
- `gh`는 기본 레포를 `upstream`(yctimlin)으로 잡는다. 새 클론마다 `gh repo set-default LeeJuOh/excalidraw-architect`. 이슈·라벨 작업 전 `gh repo view`로 확인.
- 서버 코드 변경 확인은 `npm run build` 후 `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트(claude/codex)를 시작한다. 비어 있으면 shim이 npm 게시본을 `npx`로 띄워 방금 고친 코드가 돌지 않는다. 스킬 텍스트만 고칠 땐 불필요.
- npm 게시본은 shim(`plugin/skills/archdraw/scripts/archdraw`)으로 검증한다. 레포 안에서 맨 `npx excalidraw-architect`는 같은 이름의 로컬 패키지로 잡혀 `command not found`가 난다(ADR-0011).

## 커밋

영어 1~2문장, 트레일러 없음(`Co-Authored-By` 포함). push는 지시 있을 때만.
