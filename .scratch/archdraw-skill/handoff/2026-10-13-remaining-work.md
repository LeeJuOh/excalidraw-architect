---
topic: remaining-work
date: 2026-10-13
---

# 남은 일 — 08 실사용 확인 → 적대 리뷰 F1~F3 → 03 슬라이스 B → 02

## Goal

MVP의 코드 구현은 끝났다. 남은 확인 작업을 순서대로 닫는다. 순서의 원본은 `.scratch/archdraw-skill/spec.md` "구현 이슈와 진행 순서"의 "지금 할 일" 11~13번이다.

## First Action

**`archdraw-report`를 이 PC에 다시 설치한다.** `tools/archdraw-report/README.md`의 명령을 그대로 실행한다. 그다음 `ls -la ~/.claude/skills/archdraw-report`로 심링크를 확인한다.

2026-10-13 확인 결과, `~/.claude/skills/archdraw-report`와 `~/.agents/skills/archdraw-report`가 둘 다 없다. 08 이슈의 2026-10-12 Comment에는 "이 PC에 설치했다"고 적혀 있다. 원인은 모른다. 설치한 뒤 사용자에게 08 인수를 실제 세션에서 확인하라고 알린다(아래 Next Steps 1).

## Context

- 사용자가 "뭐가 남았나"를 물었다. 처음에는 03만 보고 답했다가 범위를 넓혔다. 사용자는 **짧게**, **이슈 문서 기준으로**, **문서 경로를 붙여서** 답하기를 원한다.
- 남은 이슈는 3개다. 나머지 8개(01·04·05·06·07·09·10·11)는 `resolved`다.

| 이슈 문서 | Status | 남은 것 |
|---|---|---|
| `.scratch/archdraw-skill/issues/08-dogfooding-report-skill.md` | `ready-for-human` | 실사용 인수 8개(미체크). 사용자가 Claude·Codex 실제 세션에서 확인 |
| `.scratch/archdraw-skill/issues/03-archdraw-skill-body.md` | `ready-for-agent` | 슬라이스 B(캔버스로 판정하는 인수). 하나도 실행하지 않음 |
| `.scratch/archdraw-skill/issues/02-dogfooding-round-zero.md` | `ready-for-human` | 맨 마지막. Blocked by 01, 03~09 |

- 이슈 파일이 아닌 열린 일이 하나 더 있다: `docs/handoff/2026-10-12-adversarial-review-findings.md`(적대 리뷰 지적 F1~F3 재현).
- 내 추천 순서: 08 → F1~F3 → 03 슬라이스 B → 02. F1(스크린샷이 옛 탭 그림을 고를 수 있음)과 F2(덮어쓴 그림을 saved로 보고)는 슬라이스 B가 판정에 쓰는 기능의 결함이다. 그래서 B보다 먼저 확인한다. 사용자는 이 순서를 아직 승인하지 않았다.

## Current Progress

### Verified repo state (repo_facts.sh, 2026-10-13)

- **Branch:** `main`, `origin/main`과 같음(`4f7bff0`). push할 것 없음.
- **Working tree:** 이 핸드오프 파일 말고는 깨끗함.
- **Recent commits:** `4f7bff0`(03 핸드오프 재작성), `6dde09e`(SKILL.md "Place only"), `995c625`(적대 리뷰 핸드오프), `ba39f84`, `73b2721`, `e6d1a0c`(08b 시작 기록), `a6183a8`(archdraw-report 스킬 추가).

### 이 세션에서 한 것

- **03 슬라이스 B의 실행 방식을 정했다:** 1안 "권한 허용"이다. 사용자가 골랐다(03 핸드오프의 First Action이 요구한 선택).
- `.claude/settings.local.json`을 고쳤다. 이 파일은 gitignore 대상이라 커밋되지 않는다.
  - `permissions.allow`: `Bash(claude -p *)`, `Bash(tail -f *)`
  - `autoMode.allow`: `$defaults` + "archdraw 스킬 인수 테스트를 위한 헤드리스 `claude -p` 실행, 입력 파일 쓰기, 출력 로그 읽기, 테스트 프로세스 kill"을 허용하는 규칙 한 줄
  - **효과는 미확인이다.** 헤드리스 에이전트를 아직 다시 띄우지 않았다.
- 적대 리뷰 핸드오프(`docs/handoff/2026-10-12-adversarial-review-findings.md`)가 stale인지 확인했다. **stale이 아니다.** `995c625` 뒤에 `src/`·`frontend/`를 바꾼 커밋이 없다. 문서가 가리키는 코드도 그대로 있다(`frontend/src/App.tsx`의 `case 'elements_synced'`, `src/server.ts`의 `bestResult`·`export_image_request`, `src/core/save-state.ts`의 `recordSave()`, `src/core/snapshot-store.ts`의 `saveSnapshot()`, `plugin/skills/archdraw/SKILL.md`의 "If it is saved, delete it without asking."). 그래서 지우지 않았다. 단 한 곳은 낡았다: 문서가 가리키는 리뷰 원문 `~/.claude/plugins/data/codex-advisor-claude-code-zero/reviews/adversarial-20261012-014143.md`가 없다. 문서 안의 요약으로 재현할 수 있다.

## Decisions Made

- 03 슬라이스 B는 헤드리스 `claude -p`로 실제 스킬 호출을 시험한다(위 1안). 2안(사용자 직접 실행)과 3안(에이전트가 직접 그림)은 쓰지 않는다.
- 08의 시험 이슈는 정상 경로로 1건만 올리고, 확인한 뒤 닫는다(08 이슈 2026-10-12 Comment, 이미 결정됨).

## What Didn't Work

- ⚠️ 사용자는 긴 보고를 싫어한다("장황하게 말하지마"). 상태 보고는 이슈 문서 경로 + Status + 남은 것 한 줄로 한다.
- 처음 "뭐 할 차례?"에 최신 커밋의 핸드오프(03)만 보고 답했다. 전체 순서는 `spec.md`의 "지금 할 일" 목록과 이슈 `Status:`에서 읽는다.

## Next Steps

1. **08 실사용 확인(사용자).** 인수 8개는 08 이슈 본문의 체크박스다. 절차는 같은 파일의 "핸드오프 — 08b 실사용 확인" Next Steps 2~7이다. 시험은 이 레포가 아닌 다른 폴더에서 한다. 결과를 받으면 체크박스와 Status를 갱신한다.
2. **F1~F3 재현.** `docs/handoff/2026-10-12-adversarial-review-findings.md`의 First Action부터 시작한다. 사용자에게 설명할 때는 `AGENTS.md`의 "문제를 설명할 때" 순서를 따른다.
3. **03 슬라이스 B.** 03 이슈의 "핸드오프 — 슬라이스 B 실행 환경 막힘" 절 중 Next Steps 2~5를 따른다. 그 절의 First Action(실행 방식 묻기)은 끝났다. 1안으로 정했고 settings도 고쳤다. 먼저 헤드리스 에이전트가 이번에는 막히지 않는지 본다. nango 복사본은 scratchpad에 다시 만들어야 한다.
4. **02 도그푸딩(사용자).** 맨 마지막이다.
5. 각 일을 끝내면 `spec.md`의 "지금 할 일" 목록과 상태 표를 갱신한다. 이 목록에서 11번("08 구현")은 아직 지워지지 않았다.
