---
topic: adversarial-review-findings
date: 2026-10-12
---

# 적대 리뷰 지적 3건 — 하나씩 확인

## Goal

목표만 준 Codex 적대 리뷰가 지적 3건을 냈다. 다음 세션은 **한 건씩** 재현해서 진짜인지 확인한다. 진짜이면 사용자와 고칠지 정한다.

리뷰는 PRD·ADR을 주지 않고 목표만 줬다(블랙박스). 목표: "개발자는 코드를 읽지 않고 결정한다. 구현은 에이전트가 한다. 둘이 같은 구조를 이해했는지 텍스트로는 확인할 수 없다. 라이브 캔버스 그림으로 그 이해를 맞추고 확인한다."

## First Action

**F1부터 재현한다.** 브라우저 탭 두 개로 같은 캔버스를 연다. 탭 A에서 화살표 하나를 지운다. 에이전트가 스크린샷을 찍는다. 받은 그림에 화살표가 남아 있는지 본다. 재현 전에 `npm run build`를 하고, `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트를 시작한다(AGENTS.md Gotchas). 사용자에게 설명할 때는 AGENTS.md "문제를 설명할 때" 순서를 따른다. 재현 테스트를 쓴다면 `mattpocock-skills:diagnosing-bugs` 또는 `mattpocock-skills:tdd` 스킬이 맞다.

## Context

- 사용자는 MVP를 PRD 기준으로 다 구현했다고 본다. 그래서 스펙 대조가 아니라 "목표를 이루는가"를 묻는 리뷰를 원했다.
- 리뷰는 `/codex-adversarial --base 713706e`(업스트림 분기점)로 돌렸다. **diff만 본다.** 목표에 필요한데 아예 없는 기능은 이 리뷰가 찾지 못한다.
- 지적 3건 모두 독립 검증 에이전트가 코드 경로를 따라 "Agreed"로 판정했다. **실제 브라우저 재현은 아직 아무도 하지 않았다.** Codex는 "격리 실행에서 재현했다"고 썼지만, 검증 에이전트는 재현을 다시 돌리지 않았다.
- 코드는 아직 고치지 않았다. 사용자가 "하나씩 확인"을 원했다.
- 내 추천 순서: F1 → F2 → F3. F1이 목표(사용자 결정이 에이전트에게 닿는다)를 가장 직접 해친다.

## 지적 3건

전체 원문과 판정: `~/.claude/plugins/data/codex-advisor-claude-code-zero/reviews/adversarial-20261012-014143.md`

### F1 (high) — 스크린샷이 사용자 수정 전 탭의 그림을 고를 수 있다

1. 사용자 → 탭 A: 화살표를 지운다.
2. 탭 A → 캔버스 서버: 동기화한다.
3. 캔버스 서버 → 탭 B: `elements_synced`를 보낸다. 개수·시각만 있고 요소는 없다. `frontend/src/App.tsx`의 `case 'elements_synced'`는 로그만 남긴다. 탭 B는 옛 그림을 유지한다.
4. 캔버스 서버 → 모든 탭: `export_image_request`를 보낸다(`src/server.ts`, `pendingExports` 등록 직후 `broadcast`). 보내기 전에 장면을 다시 보내지 않는다. 업스트림(`references/mcp-excalidraw-yctimlin/src/server.ts`)은 먼저 `initial_elements`로 장면을 다시 보냈다고 검증 에이전트가 보고했다.
5. 캔버스 서버: 응답 중 `data.length`가 가장 큰 것을 `bestResult`로 고른다. 옛 그림이 더 크면 옛 그림이 에이전트에게 간다.

### F2 (high) — 덮어써서 파일에서 사라진 그림을 "saved"로 보고한다

1. 에이전트: 그림 A를 `shared.excalidraw`로 저장한다.
2. 에이전트: 그림 B만 같은 경로에 `force`로 저장한다(`src/core/mcp-dispatch.ts`에서 `recordSave(file, frameIds, …)` 호출).
3. MCP 프로세스: `src/core/save-state.ts`의 `recordSave()`가 B의 기록만 갱신한다. 같은 경로를 쓰는 A의 기록은 무효로 만들지 않는다. `stateOf()`는 파일 존재와 캔버스 해시만 본다. A도 saved로 나온다.
4. 에이전트: `plugin/skills/archdraw/SKILL.md`에 "If it is saved, delete it without asking."이 있다. A를 지운다 → A의 유일한 사본을 잃는다.

### F3 (medium) — 스냅샷에 이미지 바이트가 없다

- `src/core/snapshot-store.ts`의 `saveSnapshot()`이 `{type, version, source, elements}`만 쓴다. `files`가 없다.
- 복원 경로(`src/core/mcp-dispatch.ts`의 `clearCanvas()` → `batchCreateElementsOnCanvas(snapshot.elements, …)`, `src/cli/commands/snapshot.ts`)는 요소만 다시 만들고 성공을 보고한다.
- 같은 서버에서는 메모리의 `files`가 남아 보인다. **새 서버 프로세스에서 복원할 때만** 이미지가 빈다. 재현할 때 서버를 재시작해야 한다.

## Current Progress

### Verified repo state (repo_facts.sh, 이 문서 작성 직전)

- **Branch:** `main`
- **Uncommitted changes:** 이 핸드오프 파일 외 없음 (작성 중 다른 세션이 `ba39f84`로 issue 03 변경을 커밋함)
- **Recent commits:** `ba39f84` (issue 03 handoff 교체), `73b2721` (issue 10 hand check 종료), `e6d1a0c`, …

### 이 세션에서 한 것

- 적대 리뷰 실행, 검증 3건, 리포트 저장(위 경로). **코드 변경 없음.**

## Decisions Made

- 리뷰 방식: PRD·ADR 대신 **목표만** focus text로 준다. 리뷰어가 우리 가정을 물려받지 않게 하려고. focus text에 `.scratch/`와 `docs/adr/`를 읽지 말라고 적었다(강제는 아님).
- 고치기 전에 한 건씩 실제로 재현한다. 검증은 코드 읽기로만 됐기 때문이다.

## What Didn't Work

- ⚠️ diff 기반 리뷰는 "만들지 않은 것"을 못 본다. 목표 대비 빠진 기능을 찾으려면 별도 점검(예: `codex-research`로 레포 전체를 목표 기준으로 보게 하기)이 필요하다.

## Next Steps

1. F1 재현 → 사용자에게 현상·예시·영향·원인으로 설명 → 고칠지 결정.
2. F2 재현(두 그림을 같은 경로에 저장) → 같은 절차.
3. F3 재현(이미지 포함 캔버스 → 스냅샷 → 서버 재시작 → 복원) → 같은 절차.
4. 고칠 것으로 정한 건은 `.scratch/archdraw-skill/issues/`에 티켓으로 남긴다(`docs/agents/issue-tracker.md` 규약).
5. 선택: 목표 대비 빠진 기능을 찾는 리뷰를 따로 돌릴지 사용자에게 묻는다.
