---
topic: remaining-work
date: 2026-10-13
---

# 남은 일 — F1 해결 방향 결정 → F2·F3 그릴 → 03 슬라이스 B → 02

이 문서가 유일한 핸드오프다.

## Goal

MVP의 코드 구현은 끝났다. 남은 확인 작업을 닫는다. 지금은 적대 리뷰 지적 F1~F3을 한 건씩 그릴해서 고칠 방향을 정하는 중이다. 순서의 원본은 `.scratch/archdraw-skill/spec.md` "구현 이슈와 진행 순서"의 "지금 할 일" 12~13번이다.

## First Action

**"옛 그림의 탭 B에서 무엇이든 고치면, 탭 A에서 지운 화살표가 서버에 되살아나는가"를 실제로 시험한다.** 이 결과로 F1의 해결안(A 또는 D, 아래 "F1 그릴 상태")을 사용자가 고른다.

절차 (로컬 빌드 CLI, 아래 "재현 방법"):
1. `node dist/bin.js session start --project <scratchpad>/repro` → 세션 키와 URL을 받는다.
2. `node dist/bin.js add <f1.json> --session <key>` — 박스 `boxL`·`boxR`와 둘을 잇는 화살표 `arr1`. 화살표에도 `x`,`y`가 필요하다.
3. Chrome으로 같은 URL의 탭 A·B를 연다. 탭 A에서 화살표를 클릭하고 Delete. `curl <url>/api/elements`로 `arr1`이 없어졌는지 본다.
4. 탭 B에서 박스 하나를 끌어서 옮긴다. 다시 `curl <url>/api/elements` → `arr1`이 돌아왔는지 본다.
5. 결과를 사용자에게 `AGENTS.md` "문제를 설명할 때" 순서로, **짧게** 보고한다. 그다음 결정 질문 하나.

## Context

- 사용자는 **짧게** 답하기를 원한다("장황하게 말하지마"). 상태 보고는 표 하나나 몇 줄로. 문서 경로를 붙인다.
- 사용자는 그릴을 **질문 한 번에 하나**로 원한다.
- 설명이 안 통하면 사용자는 `/excalidraw-architect:archdraw`로 그림을 요청한다. 순서가 있는 예시(번호 단계, 주어 = 컴포넌트)가 가장 잘 통했다.
- 범위에서 뺀 것 (사용자 결정, 이 세션):
  - 08(리포트 스킬 실사용 확인)은 뺐다. `archdraw-report`는 이 PC에 다시 설치했다(`~/.agents/skills/archdraw-report/`, `~/.claude/skills/archdraw-report` 심링크).
  - GitHub `dogfooding` 이슈 #2·#3·#4는 기존 작업을 끝낸 뒤에 본다.
  - agy(Antigravity CLI)에 우리 플러그인 설치는 넘어간다. `agy plugin validate plugin` 결과: 스킬은 읽고 `mcpServers: skipped (not found)` — 캔버스 서버를 못 읽는다.

## F1~F3 재현 결과 (2026-10-13, 3건 모두 실제로 일어남)

Codex 적대 리뷰(2026-10-12, `/codex-adversarial --base 713706e`)의 지적이다. 3건 모두 이슈 06(`.scratch/archdraw-skill/issues/06-snapshot-and-export-persistence.md`)에서 만든 코드다.

- **F1 — 스크린샷이 옛 그림을 준다.** 탭 A·B를 연다 → 탭 A에서 화살표를 지운다 → 서버 요소에서 화살표가 없어진다. 탭 B 화면은 그대로다 → `screenshot` 3번 모두 화살표가 있는 그림. 응답의 `elements: 4`(화살표 없음)와 그림이 맞지 않는다.
- **F2 — 덮어쓴 그림을 "saved"로 보고한다.** `export --frame A --out shared.excalidraw` → `export --frame B --out shared.excalidraw --force` → 파일에는 B만 있다. `GET /api/save-state`는 A·B 둘 다 `saved`. 위험: `plugin/skills/archdraw/SKILL.md`의 "If it is saved, delete it without asking."(에이전트 행동은 미시험).
- **F3 — 스냅샷 복원에서 이미지가 빠진다.** 이미지가 든 `.excalidraw`를 `import` → `snapshot save` → 스냅샷 파일 키는 `type, version, source, elements`뿐 → `session end` 후 새 세션에서 `snapshot restore` → `success: true`, 이미지 요소는 `fileId`를 가진다. `GET /api/files`는 빈 목록.

## F1 그릴 상태 (결정 대기)

원인 (코드로 확인):
- `src/server.ts`의 `app.post('/api/elements/sync'` — 탭이 **장면 전체**를 보낸다. 서버는 `elements.clear()` 뒤 받은 것으로 바꾼다. 그다음 모든 탭에 `elements_synced`(개수만, 요소 없음)를 보낸다.
- `frontend/src/App.tsx`의 `case 'elements_synced'` — 로그만 남긴다. 그래서 다른 탭은 옛 그림에 머문다. 업스트림도 같다.
- `src/server.ts`의 `app.post('/api/export/image/result'` — "Keep the largest response". 파일이 가장 큰 응답을 고른다.
- 업스트림(`references/mcp-excalidraw-yctimlin/src/server.ts`의 "Re-broadcast current elements")은 스크린샷 전에 `initial_elements`로 장면 전체를 모든 탭에 다시 보냈다. 그래서 "큰 그림" 규칙이 안전했다(목적: 덜 그려진 느린 탭을 거르기).
- 06(커밋 `c6db4d4`)에서 그 재전송을 뺐다. 이유: 재전송 = 탭이 장면을 다시 적재 = 바인딩 화살표를 다시 계산해 0.5px 이동 → `saved`가 `modified`로 바뀐다(06 이슈 본문 "원인(실측, playwright로 재현)"). "큰 그림" 규칙은 남겨서 전제가 깨졌다.
- 탭을 새로고침하면 최신이 된다: 연결 때 서버가 `initial_elements`를 보낸다(`wss.on('connection'` 처리).

사용자에게 보인 해결안:

| 안 | 방법 | 남는 문제 |
|---|---|---|
| A | 스크린샷은 마지막으로 sync를 보낸 탭의 그림을 쓴다. "큰 그림" 규칙을 없앤다 | 탭 B 화면은 옛 그림(새로고침 필요). 아래 미확인 위험을 못 막는다 |
| B | sync 때 서버가 장면 전체를 다른 탭에도 보낸다 | 0.5px 문제가 다시 올 수 있다(미확인) |
| C | 탭 하나만 허용 | 탭 2개를 못 쓴다 |
| D (근본) | 바뀐 요소만 버전과 함께 주고받는다(Excalidraw 협업 방식). 탭은 그 요소만 적용한다 | 작업이 크다(탭·서버 동기화 방식 변경) |

- 사용자는 처음에 "A로 가야지"라고 했다. 그다음 "더 좋은 근본해결은 없나?"라고 물어서 D를 설명했다. **아직 정하지 않았다.** "고민되네"에서 멈췄다.
- **미확인 위험:** 옛 그림의 탭 B에서 무엇이든 고치면 탭 B가 옛 장면 전체를 sync로 보낸다 → 지운 화살표가 서버에 되살아난다. 코드로는 그렇게 보인다. 시험은 탭 A에서 지운 단계에서 사용자 메시지로 멈췄다. 이것이 First Action이다.
- 내 추천: 위험이 실제면 D(A로는 사용자 그림을 잃는다). 아니면 A로 충분하다.

## Current Progress

### Verified repo state (repo_facts.sh, 2026-10-13)

- **Branch:** `main`. 최신 커밋 `9a494df`. push는 이 세션에서 하지 않았다.
- **Uncommitted:** 이 파일(`.scratch/archdraw-skill/handoff/2026-10-13-remaining-work.md`)만. 코드 변경은 없다.

### 이 세션에서 한 것

- F1·F2·F3을 로컬 빌드로 재현했다. 결과는 위 절. 코드는 고치지 않았다.
- `archdraw-report`를 README 명령으로 다시 설치했다. 받은 `SKILL.md`는 레포 파일과 같다.
- `npm run build`를 했다(`dist/`는 gitignore).
- F1 설명 그림을 `http://127.0.0.1:3000` 캔버스(이 세션의 archdraw MCP 서버)에 그렸다. 저장하지 않았다.

## Infrastructure State

- 재현용 CLI 세션(`b49b3e`, `5283b0`, `c39c43`)은 모두 끝냈다. 테스트 스냅샷 폴더 `~/.excalidraw-architect/snapshots/repro-2cf819dc`는 지웠다.
- 재현 입력 파일은 이 세션 scratchpad의 `repro/`에 있었다. 다음 세션에서는 새로 만든다.
- `v0.2.0` 뒤에 `src/`·`frontend/` 변경이 없다. 그래서 게시본 0.2.0과 로컬 빌드의 동작이 같다.
- (미확인) 이 세션에서 `archdraw` 스킬은 플러그인 캐시의 `0.1.1` 폴더에서 로드됐다. `claude plugin list`는 0.2.0이라고 한다. 캔버스 페이지 제목도 "Excalidraw POC - Backend API Integration"이었다. 원인은 보지 않았다.

## Decisions Made

- 기존 작업(F1~F3 → 03 B → 02)을 먼저 끝낸다. 08·GitHub 이슈·agy는 뒤로.
- F1~F3는 고치기 전에 한 건씩 재현했다 → 3건 모두 실제.
- 03 슬라이스 B는 헤드리스 `claude -p`로 시험한다(1안 "권한 허용"). `.claude/settings.local.json`에 허용 규칙을 넣었다. 효과는 미확인.

## What Worked

- 로컬 빌드 CLI(`node dist/bin.js <command>`) + `curl <url>/api/...`로 서버 상태를 직접 보는 재현. MCP 재시작이 필요 없다.
- 브라우저 두 탭은 Chrome 도구로 연다. 화살표는 클릭 후 Delete. 탭은 수정하면 자동으로 sync한다.
- 사용자 설명: 처음 예시 `Left → Right` 하나로 번호 단계를 쓰니 통했다. 사용자의 "왜?" 질문에는 코드와 업스트림을 확인하고 답했다.

## What Didn't Work

- ⚠️ 긴 보고. 사용자가 "장황하게 말하지마"라고 했다. 결과는 표 하나로.
- ⚠️ 확인하지 않은 말. "서버가 탭 B에만 보낸다"고 틀리게 말했다(실제로는 모든 탭). 단계마다 코드로 확인하고 말한다.
- 첫 설명이 결론(문제 ①·②)만 말해서 안 통했다. 구체 예시가 먼저다.
- zsh에서 `B="node dist/bin.js"; $B ...`는 단어로 나뉘지 않는다. 셸 함수를 쓴다.
- `clear`는 `--yes`가 필요하다. CLI로 화살표를 만들 때도 `x`,`y`가 필요하다.

## Next Steps

1. F1 해결안을 정한다(First Action 결과 뒤). 고칠 것은 `.scratch/archdraw-skill/issues/`에 티켓으로 쓴다(`docs/agents/issue-tracker.md`).
2. F2를 그릴한다. 같은 방식: 예시 → 원인 → 해결안 → 질문 하나.
3. F3를 그릴한다.
4. 03 슬라이스 B: `.scratch/archdraw-skill/issues/03-archdraw-skill-body.md` "핸드오프 — 슬라이스 B 실행 환경 막힘"의 Next Steps 2~5. 그 절의 First Action(실행 방식 묻기)은 끝났다. 샘플 레포 nango 복사본은 scratchpad에 다시 만든다.
5. 02 도그푸딩(사용자). 맨 끝.
6. 일을 끝낼 때마다 `spec.md`의 "지금 할 일" 목록과 상태 표를 고친다. 11번("08 구현")은 아직 그대로다.
