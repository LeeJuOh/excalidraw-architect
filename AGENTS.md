# excalidraw-architect

## 프로젝트 목적과 접근

AI 에이전트와 개발할 때 개발자는 코드를 직접 보지 않고 에이전트의 말만 본다. 텍스트만으로는 서로 같은 도메인·구조·동작을 이해하고 있는지 확인하기 어렵다. 이 프로젝트는 개발자와 에이전트가 **같은 그림을 함께 보고 고치면서 공통의 이해를 만드는 것**을 목표로 한다. 도메인 모델링에서 유비쿼터스 언어를 맞추듯, 그림을 매개로 개념과 관계를 맞춘다.

개발자는 아키텍처·책임 경계·패턴·트레이드오프를 에이전트와 논의하고 결정하며, 합의한 설계의 세부 구현을 위임한다. 시각적 대화는 개발자가 설계에 계속 참여하도록 돕고, 구현과 이해 사이의 간극이 쌓이는 것을 줄인다.

이를 위해 yctimlin의 양방향 Excalidraw 캔버스를 기반으로, Excalidraw 스킬의 시각적 설명 방식과 archify의 설계 판단 원칙을 참고한다. 여기에 **백엔드 실무 질문에 맞는 그림 종류·줌 레벨·필수요소를 선택하는 `archdraw` 판단 스킬**을 더한다. 구조를 논의할 때는 구조를, 실패 처리를 논의할 때는 흐름과 상태를 함께 보도록 한다.

> yctimlin `mcp_excalidraw`(MIT) 포크. 서버 코드(그리는 손)는 업스트림 것, 내장 스킬을 **백엔드 실무 다이어그램 판단 스킬 `archdraw`**로 교체한 Claude Code / Codex 플러그인.
> 업스트림: `https://github.com/yctimlin/mcp_excalidraw` — `git remote upstream`.
>
> **현 단계: PRD 단계.** 판단 스킬 코드 0줄. 산출물은 `.scratch/archdraw-skill/spec.md`.

## SSOT 규약

- **이 파일이 맵이다. 백과사전이 아니다.** 프로젝트 목적과 접근, 규약·구조·gotcha 포인터를 둔다. 상세는 `docs/`로 분리하고 여기서 가리킨다.
- `CLAUDE.md`는 `@AGENTS.md` 한 줄 — import 전용. 내용 쓰지 말 것.
- 레포 보면 아는 것(디렉터리 목록, 빌드 명령)은 적지 않는다. 토큰은 gotcha에 쓴다.
- 빈 비계 금지 — 디렉터리는 첫 내용이 생길 때 만든다.

## 문서 위치

| 무엇 | 어디 |
|---|---|
| 스펙(PRD)·구현 슬라이스 | `.scratch/<feature-slug>/` — slug는 기능명(프로젝트명 X). 현재 `archdraw-skill/spec.md` |
| 용어 사전 | `CONTEXT.md` |
| 결정 기록 | `docs/adr/` |

**archdraw 설계 수정·구현 착수 전** [1차 검수](.scratch/archdraw-skill/review.md)·[2차 검수](.scratch/archdraw-skill/review-02-handoff.md)를 읽고 대상 이슈의 지적과 완료 조건을 확인한다. 두 검수 모두 처리 완료(2026-09-19)이며 미해결 지적은 없다. 구현 순서는 PRD 구현 순서 표를 따른다.

## 지식 소스 — 심링크 3종 (읽기 전용)

```
wiki          -> ../llm-wiki/wiki          # LLM 증류 지식 페이지. 1차 진입점: wiki/index.md
raw-articles  -> ../llm-wiki/raw/articles  # 원문 클립. 정확한 인용·수치 필요할 때만
references    -> ../references             # 외부 레포 클론 24GB. 최후에, 좁혀서만
```

sibling 레포 소유. **생성·수정·삭제 금지.** git에는 심링크째로 들어가 GitHub에선 깨진 링크로 보인다 — 정상.

**⚠️ `references/`는 24GB.** 레포 전체 `grep -r`/`find` 금지. `ls references/ | grep <키워드>` → README → 하위 순으로 좁힌다. 넓은 탐색은 서브에이전트에 위임.
포크 근거 원문 사본: `references/mcp-excalidraw-yctimlin/`(업스트림 스냅샷), `references/excalidraw-diagram-skill/`(라이선스 없음 — 문장 복사 금지), `references/archify/`(MIT).

## Gotchas

- 업스트림 `.gitignore`는 `docs/`를 무시했다. 포크에서 그 줄을 뺐다 — 업스트림 머지 시 되살아나면 다시 뺄 것. 같은 이유로 업스트림 `read_diagram_guide` 툴·`design-guide.ts`도 머지 때 되살아나면 지운다(ADR-0006, 이슈 09).
- `gh`는 기본 레포를 `upstream`(yctimlin)으로 잡는다. 이 클론은 `gh repo set-default LeeJuOh/excalidraw-architect`로 고정했지만 새 클론은 다시 해야 한다. 이슈·라벨 작업 전 `gh repo view`로 확인.
- `.gitignore`가 `.claude/`도 무시한다. 프로젝트 설정을 커밋할 일이 생기면 그때 결정.
- 서버 코드 변경을 확인할 때는 `npm run build` 후 셸에 `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔다. 비어 있으면 스킬 shim이 npm에 게시된 고정 버전을 `npx`로 띄워 방금 고친 코드가 돌지 않는다. 스킬 텍스트만 고칠 땐 불필요, npm 게시본이 없는 01 동안은 항상 필요. (shim은 01에서 생긴다)

## 커밋

영어 1~2문장. `Co-Authored-By` 없음. push는 지시 있을 때만.

## Agent skills

### Issue tracker

로컬 markdown, `.scratch/<feature-slug>/` (원본 스킬 구조 그대로). See `docs/agents/issue-tracker.md`.

### Triage labels

기본 5종 (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), 이슈 파일의 `Status:` 줄에 기록. See `docs/agents/triage-labels.md`.

### Domain docs

single-context — 루트 `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
