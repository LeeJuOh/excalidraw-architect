---
topic: remaining-work
date: 2026-10-13
---

# 남은 일 — 08 실사용 확인 → 적대 리뷰 F1~F3 → 03 슬라이스 B → 02

이 문서가 유일한 핸드오프다. `docs/handoff/2026-10-12-adversarial-review-findings.md`의 내용은 아래 "적대 리뷰 지적 F1~F3"로 옮기고 그 파일은 지웠다. 이슈 03·08 안의 "핸드오프" 절은 이 문서가 대체한다. 그 절들의 낡은 부분은 아래 Context에 적었다.

## Goal

MVP의 코드 구현은 끝났다. 남은 확인 작업을 순서대로 닫는다. 순서의 원본은 `.scratch/archdraw-skill/spec.md` "구현 이슈와 진행 순서"의 "지금 할 일" 11~13번이다.

## First Action

**`archdraw-report`를 이 PC에 다시 설치한다.** `tools/archdraw-report/README.md`의 명령을 그대로 실행한다. 그다음 `ls -la ~/.claude/skills/archdraw-report`로 심링크를 확인한다. 설치한 뒤 사용자에게 08 인수를 실제 세션에서 확인하라고 알린다(Next Steps 1).

## Context

- 사용자는 **짧게**, **이슈 문서 기준으로**, **문서 경로를 붙여서** 답하기를 원한다. 핸드오프가 여러 개면 헷갈린다고 했다.
- 남은 이슈는 3개다. 나머지 8개(01·04·05·06·07·09·10·11)는 `resolved`다.

| 이슈 문서 | Status | 남은 것 |
|---|---|---|
| `.scratch/archdraw-skill/issues/08-dogfooding-report-skill.md` | `ready-for-human` | 실사용 인수 8개(미체크). 사용자가 Claude·Codex 실제 세션에서 확인 |
| `.scratch/archdraw-skill/issues/03-archdraw-skill-body.md` | `ready-for-agent` | 슬라이스 B(캔버스로 판정하는 인수). 하나도 실행하지 않음 |
| `.scratch/archdraw-skill/issues/02-dogfooding-round-zero.md` | `ready-for-human` | 맨 마지막. Blocked by 01, 03~09 |

- 이슈 파일이 아닌 열린 일: 적대 리뷰 지적 F1~F3 재현(아래 절).
- 추천 순서: 08 → F1~F3 → 03 슬라이스 B → 02. F1·F2는 슬라이스 B가 판정에 쓰는 기능(스크린샷, 저장)의 결함이다. 그래서 B보다 먼저 확인한다. 사용자는 이 순서를 아직 승인하지 않았다.
- 이슈 안 핸드오프 절의 낡은 부분:
  - 03 "핸드오프 — 슬라이스 B 실행 환경 막힘"의 First Action(실행 방식 묻기)은 끝났다. 1안 "권한 허용"으로 정했다.
  - 08 "08b 시작" Comment(2026-10-12)는 "이 PC에 설치했다"고 쓴다. 2026-10-13에 보니 `~/.claude/skills/archdraw-report`와 `~/.agents/skills/archdraw-report`가 둘 다 없다. 원인은 모른다.

## 적대 리뷰 지적 F1~F3 (2026-10-12, 미재현)

Codex 적대 리뷰(`/codex-adversarial --base 713706e`, 업스트림 분기점부터의 diff)가 낸 지적이다. 리뷰에는 PRD·ADR을 주지 않고 목표만 줬다. 목표: "개발자는 코드를 읽지 않고 결정한다. 구현은 에이전트가 한다. 둘이 같은 구조를 이해했는지 텍스트로는 확인할 수 없다. 라이브 캔버스 그림으로 그 이해를 맞추고 확인한다." 독립 검증 에이전트가 세 건 모두 코드 경로로 "Agreed"라고 판정했다. **실제 브라우저 재현은 아무도 하지 않았다.** 코드는 고치지 않았다. 리뷰 원문 파일은 없어졌다. 아래 요약이 전부다.

재현 전에 `npm run build`를 하고, `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트를 시작한다(`AGENTS.md` Gotchas). 사용자에게는 `AGENTS.md` "문제를 설명할 때" 순서로 설명한다. 재현 테스트를 쓰면 `mattpocock-skills:diagnosing-bugs` 또는 `mattpocock-skills:tdd`가 맞다.

### F1 (high) — 스크린샷이 사용자가 고치기 전의 탭 그림을 고를 수 있다

1. 사용자 → 탭 A: 화살표를 지운다.
2. 탭 A → 캔버스 서버: 동기화한다.
3. 캔버스 서버 → 탭 B: `elements_synced`를 보낸다. 개수·시각만 있고 요소는 없다. `frontend/src/App.tsx`의 `case 'elements_synced'`는 로그만 남긴다. 탭 B는 옛 그림을 유지한다.
4. 캔버스 서버 → 모든 탭: `export_image_request`를 보낸다(`src/server.ts`). 보내기 전에 장면을 다시 보내지 않는다. 검증 에이전트에 따르면 업스트림(`references/mcp-excalidraw-yctimlin/src/server.ts`)은 먼저 `initial_elements`로 장면을 다시 보냈다(미확인).
5. 캔버스 서버: 응답 중 `data.length`가 가장 큰 것을 `bestResult`로 고른다. 옛 그림이 더 크면 옛 그림이 에이전트에게 간다.

재현: 탭 두 개로 같은 캔버스를 연다 → 탭 A에서 화살표 하나를 지운다 → 에이전트가 스크린샷을 찍는다 → 받은 그림에 화살표가 남았는지 본다.

### F2 (high) — 덮어써서 파일에서 사라진 그림을 "saved"로 보고한다

1. 에이전트: 그림 A를 `shared.excalidraw`로 저장한다.
2. 에이전트: 그림 B만 같은 경로에 `force`로 저장한다(`src/core/mcp-dispatch.ts`에서 `recordSave` 호출).
3. MCP 프로세스: `src/core/save-state.ts`의 `recordSave()`가 B의 기록만 갱신한다. 같은 경로를 쓰는 A의 기록은 무효로 만들지 않는다. `stateOf()`는 파일 존재와 캔버스 해시만 본다. A도 saved로 나온다.
4. 에이전트: `plugin/skills/archdraw/SKILL.md`에 "If it is saved, delete it without asking."이 있다. A를 지운다 → A의 유일한 사본을 잃는다.

### F3 (medium) — 스냅샷에 이미지 바이트가 없다

- `src/core/snapshot-store.ts`의 `saveSnapshot()`이 `{type, version, source, elements}`만 쓴다. `files`가 없다.
- 복원 경로(`src/core/mcp-dispatch.ts`의 `clearCanvas()` → `batchCreateElementsOnCanvas(snapshot.elements, …)`, `src/cli/commands/snapshot.ts`)는 요소만 다시 만들고 성공을 보고한다.
- 같은 서버에서는 메모리의 `files`가 남아 보인다. **새 서버 프로세스에서 복원할 때만** 이미지가 빈다. 재현할 때 서버를 재시작한다.

## Current Progress

### Verified repo state (repo_facts.sh, 2026-10-13)

- **Branch:** `main`. 이 세션 시작 시 `origin/main`과 같았다(`4f7bff0`).
- **이 세션 커밋:** `e86644c`(이 핸드오프 첫 판, push 안 함). 이번 판은 그 문서를 다시 쓰고 `docs/handoff/2026-10-12-adversarial-review-findings.md`를 지운다.
- **Recent commits:** `4f7bff0`(03 핸드오프 재작성), `6dde09e`(SKILL.md "Place only"), `995c625`(적대 리뷰 핸드오프), `ba39f84`, `73b2721`, `e6d1a0c`(08b 시작 기록), `a6183a8`(archdraw-report 스킬 추가).

### 이 세션에서 한 것

- **03 슬라이스 B의 실행 방식을 정했다:** 1안 "권한 허용"이다. 사용자가 이 대화에서 골랐다.
- `.claude/settings.local.json`을 고쳤다. gitignore 대상이라 커밋되지 않는다.
  - `permissions.allow`: `Bash(claude -p *)`, `Bash(tail -f *)`
  - `autoMode.allow`: `$defaults` + "archdraw 스킬 인수 테스트를 위한 헤드리스 `claude -p` 실행, 입력 파일 쓰기, 출력 로그 읽기, 테스트 프로세스 kill"을 허용하는 규칙 한 줄
  - **효과는 미확인이다.** 헤드리스 에이전트를 아직 다시 띄우지 않았다.
- F1~F3 문서가 아직 유효한지 확인했다. `995c625` 뒤에 `src/`·`frontend/`를 바꾼 커밋이 없다. 위 절에 적은 코드 위치는 모두 2026-10-13에 grep으로 확인했다.

## Decisions Made

- 03 슬라이스 B는 헤드리스 `claude -p`로 실제 스킬 호출을 시험한다(1안). 2안(사용자 직접 실행)과 3안(에이전트가 직접 그림)은 쓰지 않는다.
- 08의 시험 이슈는 정상 경로로 1건만 올리고, 확인한 뒤 닫는다(08 이슈 2026-10-12 Comment).
- F1~F3는 고치기 전에 한 건씩 실제로 재현한다. 검증은 코드 읽기로만 됐기 때문이다.

## What Didn't Work

- ⚠️ 사용자는 긴 보고를 싫어한다("장황하게 말하지마"). 상태 보고는 이슈 문서 경로 + Status + 남은 것 한 줄로 한다.
- ⚠️ 핸드오프를 여러 곳에 두면 사용자가 헷갈린다. 새 핸드오프는 이 폴더(`.scratch/archdraw-skill/handoff/`)에 하나만 둔다.
- 처음 "뭐 할 차례?"에 최신 커밋의 핸드오프(03)만 보고 답했다. 전체 순서는 `spec.md`의 "지금 할 일" 목록과 이슈 `Status:`에서 읽는다.
- diff 기반 적대 리뷰는 "만들지 않은 것"을 못 본다. 목표 대비 빠진 기능을 찾으려면 별도 점검이 필요하다.

## Next Steps

1. **08 실사용 확인(사용자).** 인수 8개는 08 이슈 본문의 체크박스다. 절차는 같은 파일 "핸드오프 — 08b 실사용 확인"의 Next Steps 2~7이다. 시험은 이 레포가 아닌 다른 폴더에서 한다. 결과를 받으면 체크박스와 Status를 갱신한다.
2. **F1 → F2 → F3 재현.** 위 절의 재현 방법대로 한다. 한 건씩 사용자에게 설명하고 고칠지 정한다. 고칠 건은 `.scratch/archdraw-skill/issues/`에 티켓으로 남긴다(`docs/agents/issue-tracker.md`).
3. **03 슬라이스 B.** 03 이슈 "핸드오프 — 슬라이스 B 실행 환경 막힘"의 Next Steps 2~5를 따른다. 먼저 헤드리스 에이전트가 이번에는 막히지 않는지 본다. nango 복사본은 scratchpad에 다시 만들어야 한다.
4. **02 도그푸딩(사용자).** 맨 마지막이다.
5. 각 일을 끝내면 `spec.md`의 "지금 할 일" 목록과 상태 표를 갱신한다. 11번("08 구현")은 아직 지워지지 않았다.
6. 선택: 목표 대비 빠진 기능을 찾는 리뷰를 따로 돌릴지 사용자에게 묻는다.
