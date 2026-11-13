# excalidraw-architect

## 프로젝트 목적과 접근

사람은 계속 설계한다. 에이전트가 코드를 빨리 만들수록 병목은 사람의 이해로 옮겨 간다. archdraw는 **에이전트가 캔버스에 아키텍처 그림을 그리고, 개발자가 같이 보며 고쳐** 구조·동작·변경 이유를 빠르게 이해하고 의도를 전하게 한다.
설계·구현·리뷰·PR 작성 등 AI-DLC 전 단계에서 쓰고, 그림은 PR·문서의 자료로도 남는다. 그림은 공통 언어다. 기능 판단은 사람이 아키텍처·디자인·코드 관리 방향을 판단하고 자기 의도를 전달하는 데 도움이 되는지로 한다.

> yctimlin `mcp_excalidraw`(MIT) 포크 — `git remote upstream`. 서버도 고쳐 쓰고 내장 스킬은 `archdraw`로 바꾼 Claude Code / Codex 플러그인. 업스트림과 달라진 결정은 `docs/adr/`.

## 이 파일

레포로 알 수 없는 규약과 조건별 문서 위치를 둔다. 상세는 `docs/`에 둔다. 공통 지침은 이 파일에서 고친다. `CLAUDE.md`는 이 파일을 읽는 import 한 줄이다.

## 문서 위치

| 언제 | 무엇 | 어디 |
|---|---|---|
| 구현 착수 전 | 스펙(PRD)과 구현 순서 표, 이슈 티켓 | `.scratch/<feature-slug>/` |
| 이슈 파일을 만들거나 `Status:`를 바꿀 때 | 티켓 파일 규약, 라벨 문자열 5종 | `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md` |
| 코드 탐색 전 | 용어·결정 기록 읽는 순서, 용어 준수·ADR 충돌 규칙 | `docs/agents/domain.md` → `CONTEXT.md`, `docs/adr/` |
| archdraw 재개편을 이어서 하거나, 목표·사용 장면·그림 표현·스킬 범위를 정하거나, 참고 레포를 비교할 때 | 정한 것·남은 질문·진행 방식("이어서 하기" 절), 레포별 적용 판단·검수 근거 | `docs/research/2026-11-06-archdraw-redesign.md` |
| 업스트림을 머지한 뒤 | 되살아나면 다시 지울 파일·설정 목록 | `docs/agents/upstream-merge.md` |

## 지식 소스

개념·패턴·도구의 근거가 필요할 때, 사전 지식으로 답하기 전에 `wiki/index.md`부터 찾는다.

```
wiki          -> ../llm-wiki/wiki          # LLM 증류 지식 페이지. 1차 진입점: wiki/index.md
raw-articles  -> ../llm-wiki/raw/articles  # 원문 클립. 정확한 인용·수치 필요할 때만
references    -> ../references             # 외부 레포 클론 24GB. 최후에, 좁혀서만
```

다른 레포가 소유하는 심링크다. 위 이름으로 접근한다. git에는 심링크로 저장되어 GitHub에서 대상이 열리지 않는 것은 정상이다.

- 조사할 때는 읽기만 한다. 사용자가 참고 레포 최신화를 요청하면 지정한 복제본을 갱신하고 원격 커밋과 대조한다. 위키·원문 클립 편집은 별도 요청 범위다.
- 최근 동향은 위키 작성·갱신일과 원문 게시일을 구분한다. 저자 의견·구현 사실·실험 결과를 나눠 보고한다.
- 참고 레포의 적용 여부를 판단할 때는 위키에서 원문으로 이동한다. 검수한 커밋과 실제 읽은 파일을 남기고, 문서 지침·소스 확인·실행 검증을 구분한다.
- **`references/`는 24GB다.** `ls references/ | rg <키워드>`로 레포를 고른 뒤 README와 관련 하위 경로만 읽는다. 여러 레포의 넓은 비교는 범위를 나눠 서브에이전트에 맡긴다. 전체를 재귀 검색하지 않는다.
- 포크 원문 사본은 `references/mcp-excalidraw-yctimlin/`이다. 다른 참고 코드·문장을 재사용할 때는 해당 커밋의 라이선스를 확인한다. `references/excalidraw-diagram-skill/`은 라이선스가 없어 아이디어만 참고하고 문장은 새로 쓴다.

## Gotchas

- 파일 생성·수정은 Write/Edit 또는 `apply_patch` 같은 파일 편집 도구로 한다.
- 플러그인에 들어갈 파일은 `plugin/` 아래에 둔다 — 호스트는 카탈로그가 가리키는 그 폴더만 복사한다(ADR-0011).
- 매니페스트와 스킬 shim은 **생성물이다.** `package.json`을 고치고 `npm run manifests`로 재생성한다. `npm test`·CI가 드리프트와 shim 실행 권한을 검사한다.
- `gh`는 기본 레포를 `upstream`(yctimlin)으로 잡는다. 새 클론마다 `gh repo set-default LeeJuOh/excalidraw-architect`. 이슈·라벨 작업 전 `gh repo view`로 확인.
- 서버 코드 변경 확인은 `npm run build` 후 `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트(claude/codex)를 시작한다. 비어 있으면 shim이 npm 게시본을 `npx`로 띄워 방금 고친 코드가 돌지 않는다. 스킬 텍스트만 고칠 땐 불필요.
- npm 게시본은 shim(`plugin/skills/archdraw/scripts/archdraw`)으로 검증한다. 레포 안에서 맨 `npx excalidraw-architect`는 같은 이름의 로컬 패키지로 잡혀 `command not found`가 난다(ADR-0011). README의 MCP 직접 등록 명령을 이 레포에서 시험할 땐 셸에서 `--prefix ~`를 붙인다 — README에는 넣지 않는다(JSON 설정 호스트는 `~`를 풀지 못한다).

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
