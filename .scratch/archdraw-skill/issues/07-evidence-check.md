# 07: 근거 검사 — 에이전트가 `코드` 근거를 적으면 서버가 확인하고, 틀리면 거부한다

> 02 도그푸딩(구현 뒤)의 판정이 수정 사항으로 돌아온다. 2026-10-11 그릴로 "틀리면 점선 강등"을 "틀리면 거부"로 바꿨다([ADR-0005](../../../docs/adr/0005-server-checks-evidence-and-demotes.md) 개정).

**What to build:** 에이전트가 선·박스·값에 근거 태그를 붙여 그린다. `코드` 태그는 파일 경로와 그 파일의 코드 글자(`quote`)를 적는다. 에이전트가 근거를 적거나 고칠 때, 서버는 그 글자가 지금 프로젝트의 그 파일 안에 정확히 한 곳 있는지 확인한다. 없거나 여러 곳이면 그 쓰기를 거부하고, 에이전트가 고치는 길을 에러로 알려 준다. 서버는 그림의 모양을 바꾸지 않는다. `설계`·`로그` 태그는 검사 없이 기록만 한다. 근거 태그는 캔버스에 보이지 않는 요소 데이터다 — 서버와 `describe`만 읽는다. 의미(정말 그 의존성인지)는 검사하지 않는다 — 의미 판단은 에이전트, 글자 존재 확인은 서버.

**Blocked by:** 01 (플러그인 골격), 04 (캔버스 세션의 프로젝트 루트 — 근거 경로를 푸는 기준)

**Status:** ready-for-agent

## 결정 (2026-10-11 그릴)

1. 그릴 때 `코드` 근거가 근거 없음이면 **거부**한다. 점선 강등, "서버 강등" 표시, 선을 따라다니는 근거 없음 텍스트는 없다.
2. 검사는 에이전트가 근거를 적거나 고치는 쓰기에서만 한다(요청에 `evidence`가 있을 때). 위치·색만 바꾸는 쓰기와 브라우저 sync는 검사하지 않는다.
3. 한 묶음(batch)에서 하나라도 틀리면 전부 거부하고, 틀린 것을 모두 나열한다. frame 검사(05)와 같은 방식이다.
4. `코드` 근거 = `path` + `quote`(둘 다 필수). `quote`는 파일 안에서 한 곳이어야 한다. 공백(탭·공백·줄바꿈)은 양쪽에서 모두 지우고 비교한다 — 여러 줄 코드를 한 줄로 붙여 적어도 찾는다. 줄 번호와 커밋 SHA는 없다 — 지금 파일이 기준이다.
5. `path`는 프로젝트 루트 기준 상대 경로다. 루트 밖(`..`, 절대 경로)과 `.git`은 거부한다(archify 규칙).
6. 서버는 선·박스의 모양을 바꾸지 않는다. 추론 점선에 유효한 근거가 붙어도 점선 그대로다.
7. 복원·import는 거부하지 않는다. 받아들이고 근거 없음 요소의 목록을 돌려준다. 그림은 바꾸지 않는다.
8. 복원 뒤 목록을 받은 에이전트: 같은 코드를 다른 곳에서 찾으면 근거를 고치고 사용자에게 알린다. 찾지 못하면 그 관계가 코드에서 없어졌는지 사용자에게 묻는다(스킬 규칙).
9. 거부 에러의 고치는 길은 두 개만 적는다: 맞는 `quote`로 고치기 / 확인하지 못하면 `코드` 근거를 빼고 추론 점선으로 그리기. `설계`로 바꾸라고는 적지 않는다.
10. 복원·import·복제(`copy: true`인 쓰기)는 모두 근거 없음 목록을 돌려준다(2026-10-11 사용자 결정). 셋 다 근거를 적은 때와 지금 사이에 코드가 바뀌었을 수 있다. 에이전트는 셋 다 결정 8대로 한다.

남는 위험 2개(관계없는 글자를 베껴 통과, 복원 뒤 에이전트가 목록을 알리지 않음)는 02에서 관찰한다.

## 슬라이스 A — 그릴 때 검사와 거부

**What to build:** 에이전트가 MCP나 CLI로 `코드` 근거를 붙여 그리거나 고치면 서버가 검사한다. 틀리면 아무것도 만들거나 바꾸지 않고 거부한다. 스킬 글과 그리기 규격도 같은 커밋에서 거부 기준으로 고친다 — 서버가 `quote`를 검사하기 전에 스킬이 `quote`를 쓰라고 하면 서로 맞지 않기 때문이다.

**Blocked by:** 없음

**Status:** resolved (2026-10-11)

- [x] 파일 안에 한 곳 있는 `quote`로 `코드` 태그 화살표를 만들면 그린 그대로 생긴다
- [x] 파일이 없거나 `quote`가 파일에 없으면 거부되고 요소가 생기지 않는다. 에러에는 요소, 경로, `quote`, 이유, 그리고 고치는 길 두 개(맞는 `quote` / `코드` 근거를 빼고 추론 점선)가 있다. `설계` 안내는 없다
- [x] `quote`가 파일에 여러 번 나오면 거부되고, 에러에 나온 횟수와 "한 곳으로 좁혀라"가 있다. 바로 옆 글자를 붙여 한 곳으로 좁히면 통과한다
- [x] 탭·공백·줄바꿈만 다른 `quote`도 찾는다. 줄바꿈 자리에 공백 없이 한 줄로 붙인 `quote`도 찾는다. 여러 줄 `quote`도 찾는다
- [x] `코드` 태그에 `path`나 `quote`가 없거나, 태그가 3종 밖이거나, 값의 타입이 틀리면 거부된다
- [x] 절대 경로, `..`, `.git`을 가리키는 `path`는 거부된다. 프로젝트 루트 밖을 가리키는 심볼릭 링크도 거부된다
- [x] batch에서 하나라도 틀리면 아무것도 생기지 않고, 틀린 것이 모두 나열된다
- [x] 화살표의 `evidence`를 틀린 값으로 `update`하면 거부되고 요소는 이전 그대로다. `evidence` 없이 위치만 `update`하면 검사하지 않는다(근거 파일이 그 사이 바뀌었어도 통과)
- [x] `코드` 태그 박스도 같은 규칙으로 검사된다
- [x] 서버는 모양을 바꾸지 않는다: 추론 점선 + 추론 라벨에 유효한 근거를 붙여도 점선과 라벨이 그대로다
- [x] 파일에 있는 글자지만 그림의 관계와 무관해도 통과한다 — 서버는 의미를 판단하지 않는다
- [x] `설계`·`로그` 태그는 검사 없이 통과하고 `describe`에 태그가 보이며, 캔버스 스크린샷에는 태그 텍스트가 없다
- [x] 태그 없는 요소는 업스트림과 동일하게 동작한다(하위 호환)
- [x] MCP(create/batch/update)와 CLI(`add`/`apply`/`update`)가 같은 결과를 낸다
- [x] 그리기 규격의 선 표기 표에 근거 검사 실패 행이 없다. 스킬 본문과 조작 가이드의 `evidence` 모양이 `path` + `quote`이고, 근거를 못 찾을 때의 행동이 거부 기준이다(점선으로 둔다, 근거 없음 표시 같은 문장이 없다)
- [x] 03 슬라이스 B의 근거 인수가 거부 기준으로 바뀌어 있다
- [x] 기존 `npm test` 통과

## 슬라이스 B — 복원·import·복제 때 근거 없음 목록

**What to build:** 저장한 뒤 코드가 바뀌어 근거 없음이 된 요소가 있어도 `snapshot restore`·`import`·복제는 된다. 결과에 근거 없음 요소의 목록이 나온다. 스킬은 그 목록을 받았을 때의 행동(결정 8)을 안다.

**Blocked by:** 슬라이스 A

**Status:** resolved (2026-10-11)

- [x] 근거 코드를 지운 뒤 `snapshot restore`하면 복원되고, 그림 모양은 그대로이며, 결과에 근거 없음 요소의 목록(요소, 경로, `quote`, 이유)이 있다. 근거가 맞는 요소는 목록에 없다
- [x] `import`도 같다. 목록의 요소 ID는 import가 새로 발급한 ID다
- [x] 복제도 같다(결정 10). 목록의 요소 ID는 복사본의 ID다
- [x] 목록은 결과의 앞부분에 있어 다른 결과에 묻히지 않는다
- [x] MCP와 CLI가 같은 결과를 낸다
- [x] 스킬 글에 결정 8이 있다: 같은 코드를 찾으면 고치고 알림, 못 찾으면 사용자에게 물음

## 슬라이스 C — 브라우저 왕복에서 근거 보존

**What to build:** 사용자가 브라우저에서 요소를 만지고 저장·재로드해도 `evidence`가 남는다. sync는 근거를 검사하지도 쓰지도 않는다 — 서버는 브라우저가 보낸 `evidence`를 무시하고 같은 id의 근거를 유지한다. 브라우저에서 복제·붙여넣기로 생긴 요소에는 근거가 없다.

**Blocked by:** 슬라이스 A

**Status:** resolved (2026-10-12)

**결정 (2026-10-12 그릴, [ADR-0005](../../../docs/adr/0005-server-checks-evidence-and-demotes.md) Consequences)**

- 원인: 브라우저가 서버 장면을 받을 때 Excalidraw의 요소 변환(`convertToExcalidrawElements`)이 모르는 키를 버려 `evidence`가 빠진다. 그 뒤 sync가 서버를 덮어써 근거가 지워진다(Red 테스트로 확인).
- 고치는 곳은 서버 sync다. 프론트는 고치지 않는다. 프론트에서 다시 붙이면 브라우저 복제본이 원본의 근거를 검사 없이 달고 나가서 기각했다. `customData`로 옮기기는 서버·`describe`·스냅샷 모양이 모두 바뀌어 기각했다.
- 남은 한계(막지 않는다): 브라우저에서 지우고 sync한 뒤 실행 취소로 살린 요소는 근거를 잃는다. 지운 요소의 근거를 기억하면 에이전트가 같은 id로 새 요소를 만들 때 옛 근거가 붙는다. 결과는 "근거 없음"이지 "틀린 근거"가 아니다.

- [x] 브라우저에서 `코드` 태그 화살표를 끌어 옮긴 뒤 `describe`에 `evidence`가 그대로 있다
- [x] 근거 코드를 지운 상태에서 브라우저로 화살표를 옮겨도 sync가 성공한다(검사하지 않음)
- [x] 브라우저 탭을 재로드한 뒤에도 `describe`에 `evidence`가 남아 있다
- [x] 브라우저에서 복제한 화살표에는 `evidence`가 없다. 원본에는 그대로 있다
- [x] 캔버스 스크린샷에 근거 태그 글자가 없다(슬라이스 A에서 미룬 브라우저 확인)
- [x] 기존 `npm test`와 `npm run test:canvas` 통과

## 착수 전 검수 결과 처리 (2026-10-11)

2026-10-10 핸드오프의 미결 결정 4건과 문구 2건은 위 결정으로 정리됐다. 검수 보고서: `~/.claude/plugins/data/codex-advisor-claude-code-zero/reviews/verify-20261010-131533.md`(레포 밖).

- 결정 1(태그를 바꿀 때의 전이)·2(추론 점선에 틀린 근거): 강등과 복구가 없어져 사라졌다. 틀리면 거부된다.
- 결정 3(sync에서 비교할 이전 상태): sync는 검사하지 않아 사라졌다(결정 2).
- 결정 4(`evidence` 모양): 결정 4·5로 정했다. 모양이 틀린 것도 거부한다.
- 문구 "그릴 때마다": 검사 조건을 "에이전트가 근거를 적거나 고칠 때"로 바꿨다.
- import ID 재매핑 항목: 근거 없음 텍스트가 없어져, 슬라이스 B 목록의 ID로 바뀌었다.

## Comments

### 슬라이스 A 결과 (2026-10-11)

확인: `scripts/check-evidence.mjs`(`npm run test:evidence`, `npm test`에 묶음) 16개 케이스. REST·MCP stdio·CLI를 실제 빌드로 부른다. 거부 케이스는 서버의 검사 줄을 빼면 실패하고, 복원 케이스는 복원에도 검사하면 실패하는 것을 확인했다.

- 스크린샷 인수는 브라우저를 띄우지 않고 확인했다: `expandElementsForExport()`가 만드는 요소에 근거 글자를 가진 text가 없다. 브라우저 화면 확인은 슬라이스 C의 Playwright에서 한다.

임의로 정한 것(슬라이스 B·C도 이것을 따른다):

1. 복원·import·복제는 batch 본문의 `copy: true`로 구분한다(용어 사전이 import를 복원이라 부르지 않아 `restore`가 아니다). 서버는 이때 검사를 통째로 건너뛴다(모양이 틀린 근거도 받는다). 복제도 원본의 `evidence`를 실어 보내지만 `copy: true`라 검사하지 않는다. 슬라이스 B는 `storeCreatedElements()`의 `copy` 갈래에서 `findEvidenceProblems()`로 목록을 만든다.
2. 공백 규칙: 양쪽에서 공백을 모두 지운 뒤 비교한다(결정 4, 2026-10-11 사용자 결정). `f(a,b)`와 `f(a, b)`는 같다. `int x`와 `intx`도 같다 — 지어낸 코드는 여전히 거부되므로 받아들였다.
3. 모양 검사는 서버의 `findEvidenceProblems()` 한 곳이다. MCP zod는 `z.unknown()`, MCP 툴 스키마는 안내용이다.
4. 태그 값은 영어 `code`/`design`/`log`. 한국어 태그는 거부된다.
5. `design`·`log`의 `path`·`quote`는 있으면 문자열이어야 한다. 모르는 키는 검사하지 않는다.
6. `evidence: null`은 근거를 지우는 것이고 검사하지 않는다.
7. `quote` 횟수는 겹치는 것도 센다.
8. `describe` 표시 모양: `evidence: code <path> "<quote>"`, `evidence: design`.
9. 스킬 글(`zoom-levels.md`)에 "코드에 있을 것 같지만 찾지 못한 관계는 추론이지 `design`이 아니다"를 넣었다. 03 슬라이스 B에 같은 인수를 넣었다.
10. `.git` 비교는 대소문자를 무시한다(macOS에서 `.GIT/config`가 `.git/config`를 연다).
11. 남은 한계: CLI `apply`의 update는 하나씩 보내므로 원자적이지 않다(기존 동작, 05 frame 검사와 같다). 같은 batch에 frame 오류가 있으면 frame 에러가 먼저 나와 근거 문제는 다음 시도에 나온다. `copy: true`는 맨 REST로도 보낼 수 있다(MCP·CLI는 복원·import·복제에서만 보낸다).
12. 스킬 글은 skill-creator-pro의 eval 루프를 돌리지 않았다. 고치기 전 스냅샷: `~/.claude/plugins/data/skill-creator-pro-claude-code-zero/archdraw-07-evidence/skill-snapshot/`. 스킬 동작은 03 슬라이스 B와 02에서 확인한다.

### 슬라이스 B 결과 (2026-10-11)

확인: `scripts/check-evidence.mjs`의 `restoreAndImportAreNotRefused()`. 근거 코드를 지운 뒤 restore·duplicate·import를 CLI와 MCP로 각각 부른다. 맞는 근거(`keep`)는 목록에 없고, 목록의 ID는 복사본·import가 새로 만든 ID다. 단언을 먼저 넣고 restore → duplicate → import 순으로 실패를 본 뒤 고쳤다.

임의로 정한 것:

1. 서버 batch 응답의 필드 이름은 `staleEvidence`다. 항목 모양은 거부 에러와 같은 `EvidenceProblem`(`id`, `type`, `path`, `quote`, `reason`)이다. `copy`가 아니면 빈 배열이다.
2. CLI JSON은 `success` 바로 뒤에 `staleEvidence`를 둔다. 비어도 `[]`를 넣는다.
3. MCP 글은 목록이 있을 때만 맨 앞에 블록을 둔다: `Evidence no longer checks out for N element(s); they were placed as saved:` + 거부 에러와 같은 모양의 줄. 비면 블록이 없다. 목록에는 코드에 없는 것뿐 아니라 여러 곳에 있는 것과 모양이 틀린 것도 들어가서 "not found"라 하지 않았다. 복제·import는 요소를 더하므로 "the drawing was not changed"도 쓰지 않았다(코드 리뷰).
6. 목록은 저장 전에 만든다. 검사 중 예외가 나도 요소가 저장만 되고 브라우저에 알려지지 않는 일이 없다(코드 리뷰).
7. 리뷰에서 고치지 않은 것: 요소마다 파일을 동기로 다시 읽음(슬라이스 A 검사와 같은 방식, 큰 스냅샷에서만 문제), sync 꺼진 모드에서 빈 목록(레거시 모드), 목록 전달 헬퍼 통합(호출자마다 한 줄).
4. `batchCreateElementsOnCanvas()`·`batchCreateElementsStrict()`는 `{ elements, staleEvidence }`를 돌려준다(`CreatedBatch`). copy가 아닌 호출자는 `elements`만 쓴다.
5. 스킬 글(결정 8)은 `references/zoom-levels.md` "Evidence tags" 끝에 두고, `canvas-ops.md`의 Evidence 항목에서 가리킨다. "못 찾으면 선을 고치기 전에 묻는다"로 적었다. 고치기 전 스냅샷: `~/.claude/plugins/data/skill-creator-pro-claude-code-zero/archdraw-07-evidence-b/skill-snapshot/`. eval 루프는 돌리지 않았다(슬라이스 A와 같음).

### 핸드오프 — 슬라이스 C 그릴 뒤, 구현 전 (2026-10-12)

**Goal:** 07을 마친다. 슬라이스 C(브라우저 왕복에서 근거 보존)를 구현하고, 사용자 확인 뒤 커밋 한 번 한다. 그다음 07 전체를 `/code-review`로 검토한다. 어긋나면 멈추고 보고한다. push는 지시가 있을 때만 한다.

**First Action:** `/mattpocock-skills:tdd`로 이어 간다. `tests/browser/scene-reload.spec.mjs`의 `code evidence survives a browser drag and sync`는 이미 Red다(`arrow.evidence`가 `undefined`). `src/server.ts`의 `POST /api/elements/sync`에서, `elements.clear()` 전에 id별 `evidence`를 꺼내 두고 받은 요소의 `evidence`는 버린 뒤 같은 id에 이전 값을 다시 붙여 Green으로 만든다. 실행: `npm run build && npx playwright test -g "code evidence"`.

**Context:**
- 슬라이스 C의 결정·인수 기준·남은 한계는 위 "슬라이스 C" 절과 ADR-0005 Consequences(2026-10-12 줄)에 있다. 다시 토론하지 않는다.
- 원인(확인함): 브라우저 `frontend/src/utils/scene.ts` → `prepareServerScene()`이 `convertToExcalidrawElements()`를 부르고, Excalidraw 0.18.1의 `_newElementBase()`는 아는 키와 `customData`만 새 객체에 넣는다. `restoreElements()`는 모르는 키를 남긴다. 프론트는 고치지 않는다.
- 테스트 경계: Playwright(`tests/browser/`, `npm run test:canvas`). 새 케이스는 같은 spec 파일에 넣는다(헬퍼 `seed`·`sync`·`serverScene` 재사용). 이번에 넣은 헬퍼: `codeEvidenceArrow()`(`/health`의 `projectRoot`에 `orders.ts`를 쓰고 `code` 근거 화살표 `ev`를 batch로 만든다), `dragArrow()`.
- 남은 Red 후보(인수 기준 순):
  - 근거 코드를 지운 뒤 브라우저로 옮겨도 sync 성공.
  - 재로드 뒤 `GET /api/elements`에 `evidence`.
  - 복제본에 `evidence` 없음. ⚠️ 지금 브라우저는 `evidence`를 아예 버리므로 UI 복제 테스트는 처음부터 통과한다. "sync는 브라우저가 보낸 `evidence`를 무시한다"를 Red로 보려면 `POST /api/elements/sync`에 새 id + `evidence`를 직접 보내 근거가 없는지 본다.
  - 스크린샷에 태그 글자 없음.
- 끝 보고 전에 "슬라이스 C 결과" 코멘트에 임의로 정한 것을 적고, 체크박스·Status를 갱신한다. ADR이 이미 적은 내용은 코드 주석으로 다시 쓰지 않는다.

**Current Progress** (repo_facts.sh로 확인):
- 브랜치 `main`. 마지막 커밋 `12bbbd7`(슬라이스 B), push하지 않음(`origin/main...HEAD` = `0 1`).
- 커밋하지 않은 변경 4개:
  - `tests/browser/scene-reload.spec.mjs`: Red 케이스 1개와 헬퍼 2개.
  - `docs/adr/0005-server-checks-evidence-and-demotes.md`: sync는 근거를 쓰지 않는다, 기각안, 남은 한계.
  - `CONTEXT.md`: 근거 태그·browser edit 정의.
  - 이 이슈 문서: 슬라이스 C 결정·인수 기준, 이 핸드오프.
- 서버 코드는 아직 고치지 않았다.

**What Worked:**
- 고치기 전에 Red 테스트로 사실을 확인하고, Excalidraw 번들 코드로 버리는 지점을 짚었다.
- 그릴에서 복제 경우를 따라가다 고칠 자리를 프론트에서 서버로 바꿨다. 서버 쪽이 두 문제를 한 번에 막았다.

**What Didn't Work:**
- ⚠️ 설명이 길고 추상적이면 사용자가 "장황하게 말하지마", "예시 들어"라고 한다. AGENTS.md "문제를 설명할 때" 순서(현상 → 컴포넌트별 번호 예시 → 영향 → 원인)를 처음부터 짧게 지킨다. 질문은 한 번에 하나다.
- 보고·질문은 모두 한국어로 쓴다.

**Next Steps:**
1. 슬라이스 C 구현 → 끝 보고 → 사용자 확인 → 커밋.
2. 07 전체를 `/code-review`로 검토한다. 07 `Status`와 `spec.md`의 07 행을 고친다.
3. 순서 표대로 10 → 08 → 03 슬라이스 B → 02.

### 슬라이스 C 결과 (2026-10-12)

확인: `tests/browser/scene-reload.spec.mjs`에 브라우저 케이스 6개(끌어 옮기기, 근거 코드를 지운 뒤 옮기기, 재로드, sync에 직접 보낸 `evidence` 무시, UI 복제(`Ctrl/Cmd+D`), SVG 스크린샷). 서버의 다시 붙이는 줄을 빼면 앞의 5개가 실패하는 것을 확인했다. `npm run test:canvas` 26개, `npm test` 통과.

임의로 정한 것:

1. 서버는 sync 직전 장면에서 `evidence` 칸이 있는 요소만 id별로 기억한다. `evidence: null`이 저장된 요소는 `null` 그대로 남는다.
2. "sync는 브라우저가 보낸 `evidence`를 무시한다"는 UI로 Red를 볼 수 없어(브라우저가 이미 버림) `POST /api/elements/sync`에 직접 보내 확인했다. 같은 id에 다른 근거를 보내도 이전 근거가 남고, 새 id에 보낸 근거는 저장되지 않는다.
3. 스크린샷 확인은 `POST /api/export/image`의 SVG로 했다. 같은 장면의 text 글자(`Order flow`)가 SVG에 있는 것을 대조로 두고, 근거의 `path`·`quote`가 없는 것을 본다. PNG 픽셀은 보지 않았다.
4. 테스트 헬퍼 `seed`도 sync를 쓰므로, 이제 `seed`로는 근거를 심을 수 없다. 근거가 필요한 브라우저 케이스는 `codeEvidenceArrow()`(batch)로 만든다.

5. 인수 기준의 "`describe`에 남아 있다"는 `GET /api/elements`의 `evidence`로 확인했다. `describe`는 같은 저장소를 읽고, 표시 모양은 슬라이스 A에서 확인했다.
