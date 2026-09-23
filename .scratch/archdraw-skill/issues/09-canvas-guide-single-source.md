# 09: 그리기 규격 단일 원본 — 서버 md 한 벌을 MCP `instructions`·`resources`로

> 결정: [ADR-0006](../../../docs/adr/0006-canvas-guide-single-source-via-mcp.md). 근거·상한 출처: [`docs/research/2026-09-19-mcp-guidance-delivery.md`](../../../docs/research/2026-09-19-mcp-guidance-delivery.md). 2026-09-19 03에서 분리.

**What to build:** 스킬 없이 MCP 서버만 등록한 에이전트도 접속만으로 치수·색·바인딩 규격의 핵심을 받고, 전문이 필요하면 리소스 하나를 읽는다. 스킬을 쓰는 에이전트도 같은 리소스를 읽는다. 규격 원본은 서버 패키지 안 md 파일 하나이며 코드 문자열·스킬 문서에 사본이 없다. 업스트림의 가이드 툴은 사라진다.

- 원본은 서버 패키지 안 md 파일 하나. npm 게시본과 로컬 빌드 양쪽에서 서버가 시작 시 그 파일을 읽는다 — `package.json` `files`에 md가 포함되고, 경로는 `dist/`에서 실행될 때와 npx로 받은 패키지에서 실행될 때 모두 맞아야 한다. 파일이 없으면 시작 실패를 로그로 알린다(조용히 빈 규격으로 뜨지 않는다).
- 내용 범위: 색 팔레트, 최소 크기·간격 등 치수, 화살표 바인딩 규약(바인딩 ID·`fillStyle` 등 툴 파라미터 규약 포함), 그리기 순서, 안티패턴. 업스트림 `design-guide.ts`의 "Diagram Type Templates"(architecture·flowchart·ER)는 넣지 않는다 — 그림 종류는 03 라우팅 표 담당. 선 표기는 PRD §3 "선 표기"로 교체한다(dashed = async/optional/event 규칙 제거, 점선은 확인되지 않음 전용).
- 좌표 규칙(2026-09-19 그릴 Q1, drawio-mcp `shared/xml-reference.md` "Reasoning budget" 관행): 에이전트가 백지에서 새로 그리는 요소는 노드마다 (열, 행) 칸을 정하고 고정 공식 `x = 열×간격 + 여백`, `y = 행×간격 + 여백`으로 좌표를 찍는다. 숫자(2026-09-19 그릴 Q2): 박스 200×60 고정, 열 간격 320, 행 간격 180, 여백 40 — 간격은 박스에 라벨 있는 화살표 최소 120px(업스트림 값)을 더한 것. 박스 크기는 이름 길이에 따라 바꾸지 않는다(가변이면 열마다 최대 너비 계산이 생겨 Q1 Do NOT과 충돌). 200px에 안 들어가는 이름은 첫 배치에서 줄바꿈으로 두고, 스크린샷 확인(PRD 가독성 규칙) 때 그 박스만 넓힌다. 사용자가 말로 특정 박스를 넓히라 하면 그 요소만 수정하고 겹치는 이웃은 간격만 띄워 옮긴다. 좌표·배치 한정 Do NOT 목록을 같이 둔다 — 산문으로 x,y 계산 금지, 찍은 뒤 재검토·조정 금지, 두 노드를 같은 칸에 두지 않기. 방향(위→아래 / 왼→오른)은 그림마다 하나 골라 흔들리지 않는다(drawio 관행). 그림 종류별 열·행 의미는 적지 않는다 — 02 관찰 항목(2026-09-20 그릴 Q3 (c)). 업스트림의 "align·distribute·스크린샷으로 다듬어라" 절은 뺀다. 원점은 그림마다 그 그림의 왼쪽 위이며 캔버스 원점이 아니다(한 캔버스에 그림 여러 개). 공식은 백지에 새 그림을 그릴 때만이다 — 이미 있는 그림에 요소를 추가할 때는 공식을 쓰지 않고 이웃 요소 옆에 간격만 띄워 놓는다(사용자가 옮긴 뒤엔 격자가 아니므로). 사용자가 옮긴 요소·초안 정식화는 사용자 배치를 따른다(PRD "사용자가 옮긴 배치 = 정답"). `align`·`distribute` 툴은 남기고 md의 지시만 뺀다. 서버는 좌표를 계산하지 않는다 — 02 도그푸딩에서 겹침·선 엉킴이 반복되면 서버가 (열, 행)을 받아 배치하는 방식으로 승격을 별도 이슈로 검토한다.
- 전달 1 — initialize `instructions`: md에서 뽑은 요약. 앞 512자에 바인딩 필수·최소 크기·간격 핵심을 자립형으로, 전체 2KB 이내, 끝에 "전문은 리소스 `guide://canvas`" 한 줄. Claude Code는 2KB에서 자르고 Codex는 앞 512자를 핵심으로 본다. 요약은 md 안의 표시된 절(예: 첫 절)을 그대로 쓰거나 빌드 시 생성하되, 손으로 두 벌 유지하지 않는다.
- 전달 2 — 리소스 `guide://canvas`: md 전문. `resources` capability를 켜고 `resources/list`·`resources/read`에 응답한다.
- 삭제: `read_diagram_guide` 툴(등록·디스패치·상태 판정 세 곳)과 `design-guide.ts`의 규격 문자열. 업스트림 머지 시 되살아나면 다시 지운다(AGENTS.md gotcha에 추가).
- 스킬 몫(03에서 수행): SKILL.md·`references/canvas-ops.md`는 규격 값을 적지 않고 "그리기 전 리소스 `guide://canvas`를 읽는다"로 가리킨다. 이 이슈는 서버 쪽만 다룬다.
- 로컬 확인은 `npm run build` 후 `ARCHDRAW_BIN`을 두고 한다(AGENTS.md gotcha).

**Blocked by:** 01 (플러그인 골격 — npm 패키지 이름·`files`·게시 경로가 정해져야 md 동봉 경로를 확정)

**Status:** resolved (2026-09-21 — 인수 8개 전부 통과. 문서 동기화 4건은 아래 핸드오프 참조)

- [x] `npm pack` 산출물(tarball) 안에 규격 md가 들어 있고, 그 tarball을 설치해 띄운 서버가 md를 읽어 뜬다
- [x] `initialize` 응답의 `instructions`가 2KB 이내이고, 앞 512자만 잘라 읽어도 바인딩 필수·최소 크기·간격이 들어 있으며, 끝에 `guide://canvas` 안내가 있다
- [x] `resources/list`에 `guide://canvas`가 있고 `resources/read` 결과 본문이 md 파일 내용과 바이트 단위로 같다
- [x] `tools/list`에 `read_diagram_guide`가 없고, 레포에서 `design-guide` 문자열 상수가 사라졌다
- [x] md에 좌표 공식(열·행 → x,y)과 좌표·배치 한정 Do NOT 목록이 있고, "align·distribute로 다듬어라" 류의 사후 조정 지시가 없다
- [x] md에 "Diagram Type Templates" 절이 없고, dashed = async/optional/event 규칙이 없으며, PRD §3 선 표기가 들어 있다
- [x] md를 지우고 서버를 띄우면 시작 실패 원인이 로그에 나온다
- [x] Claude Code에 서버를 등록하면 세션 시스템 프롬프트의 MCP 지침 블록에 요약이 보인다(Codex에서 `instructions`가 어디에 실리는지는 02 관찰 항목)

## Comments

**2026-09-21 — 서버 구현 완료, 호스트 확인 1건 남음.**

- 원본은 `docs/canvas-guide.md` 한 벌. `package.json` `files`에 그 경로만 넣어 ADR·조사 문서는 tarball에서 뺐다. `src/core/canvas-guide.ts`가 `../../docs/canvas-guide.md`를 읽는다 — `version.ts`가 `package.json`을 찾는 것과 같은 경로 형태라 `dist/`와 npm 설치본 양쪽에서 맞는다.
- 요약은 md 안 `<!-- instructions:start -->`~`<!-- instructions:end -->` 구간을 그대로 잘라 쓴다. 코드에는 규격 값이 한 줄도 없다. 현재 1,294바이트.
- md 읽기는 `index.ts`의 `runServer()`에서 한다. 커넥션마다 부르는 팩토리에만 두면 실패가 SDK 커넥션 오류로 들어가 `onerror` warn 한 줄로 끝나서, 시작 시점에 `logger.error` + stderr + `exit(1)`로 떨어지게 했다.
- 인수 1~7은 `scripts/check-mcp-stdio.mjs`의 와이어 검사 3개(요약·리소스·md 없을 때 시작 실패)와 `scripts/check-pack-contents.mjs`로 자동 판정한다. 8개 전부 통과. md 없는 경우는 레포 안 임시 트리에 `dist`+`package.json`만 복사해 띄워 확인한다(레포의 md는 건드리지 않음).
- tarball 확인은 레포 밖에서 했다(AGENTS.md gotcha): `npm pack` → 임시 프로젝트에 설치 → `initialize`에 요약이, `resources/list`에 `guide://canvas`가 나왔다.
- `check-pack-contents.mjs`가 npm 11의 `npm pack --json`(배열 아닌 객체)에서 깨져 있어 두 형태를 모두 받게 고쳤다. 기존 버그이고 CI(npm 10)에서는 드러나지 않았다.
- 선 표기의 보이는 라벨은 **영어 5종으로 고정**한다(`[sync]`·`[async]`·`response:`·`inferred`·`no evidence:`) — 사용자 결정(2026-09-22). PRD §3의 한국어 문자열(`[동기]` 등)과 다르며, 캔버스에 영어 라벨이 보인다. 이유: 라벨이 매 그림 같아야 하고, 대화 언어에 따라 흔들리면 안 된다. 초안에서 3종만 영어로 박고 2종은 "사용자 언어로"라고 둔 것이 모순이라 코드 리뷰에서 잡혔다. 결정은 ADR-0012에 적었고, PRD §3 표와 다른 문서의 문자열 사본은 아래 핸드오프대로 지웠다.
- 09 범위 밖 2줄 수정: `skills/excalidraw-skill/`(03이 교체할 업스트림 스킬)이 지워진 `read_diagram_guide`를 부르라고 적고 있어 `guide://canvas`로 바꿨다. 규격 값 복사는 그대로 두었다 — 03 몫.
- 호스트 확인은 `ARCHDRAW_BIN`을 로컬 빌드로 두고 `claude -p`로 자식 세션을 띄워 했다 — 그 세션이 시스템 프롬프트의 archdraw MCP 지침을 그대로 뱉어 요약이 실린 것을 확인했다. 대화형 재시작 없이 이 방법으로 판정할 수 있다.

---

## 핸드오프 — 라벨 영어 고정에 따른 문서 동기화 (2026-09-22)

구현·인수는 끝났다. 남은 것은 문서 동기화이고 코드 변경은 없다.

### First Action

없다. 작업 목록 전부 완료, 확인 grep 통과(2026-09-22). 다음은 아래 "이후"의 03이다.

### 왜 이게 남았나

`docs/canvas-guide.md`의 선 표기 표 5행 중 3행만 영어 문자열이 박혀 있고 2행은 "a sync marker"처럼 비어 있었다. 코드 리뷰(Spec 축)가 이 불일치를 잡았고, 사용자가 **5종 전부 영어 고정**으로 결정했다(2026-09-22). md는 커밋 `bcfd0eb`에서 고쳤지만, 같은 값을 들고 있는 다른 문서들이 한국어 문자열을 인용하고 있었다. 그대로 두면 03·07이 PRD나 자기 티켓을 근거로 `[동기]`를 써서 ADR-0006이 없애려던 이중 원본이 부활한다.

### 작업 목록 (2026-09-22 검수 후 확정)

원안 4건을 검수해 1건은 뺐고, 같은 문자열을 든 문서 4곳을 더 찾았다. 원칙은 하나다 — **인용된 캔버스 문자열(`"근거 없음: A→B"`, `` `[동기]` `` 류)을 지우고, 개념명은 한국어로 두고, 문자열이 필요한 자리는 `docs/canvas-guide.md`를 가리킨다.**

- [x] **`docs/adr/0012-canvas-labels-fixed-english.md` 신규.** 결정·기각지 3개·"개념명은 한국어, 캔버스 문자열은 영어" 대응.
- [x] **PRD `spec.md`.** 선 표기 표의 라벨 열을 "동기 표시·응답 표시…"로 바꾸고 표 위에 원본 포인터. 150·151·187행의 인용도 뺐다. 187행은 07 구현자가 읽는 줄이라 포인터를 명시했다.
- [x] **`CONTEXT.md`.** 용어 사전에서 렌더 문자열을 **뺐다**(추가가 아님). "근거 없음"은 "그림에서는 점선으로 나타난다"로, "점선" 항목의 괄호 라벨 둘 삭제. 사전은 개념만 담는다.
- [x] **이슈 07.** 서버가 텍스트를 생성하는 이슈라 구현자가 문자열을 코드에 박는다. 5·9·10·16행과 인수 25·26·37·38행의 인용을 지우고 9행에 원본 포인터.
- [x] **이슈 03.** 24·25·51행. 문자열 인용은 없었고 "PRD 선 표기를 적용"을 "결정은 PRD, 문자열은 `guide://canvas`"로.
- [x] **ADR-0005.** 3·19행의 `"근거 없음: A→B"`·`"근거 없음: <박스 이름>"`, 5행의 "구체 표기는 PRD §3" 포인터를 `docs/canvas-guide.md`로.
- ~~AGENTS.md Gotchas 한 줄~~ — **뺐다.** `docs/canvas-guide.md` 첫 문단이 이미 런타임 입력·마커 의미를 설명하고, `npm test`(`test:mcp`)가 마커 구간·크기·핵심어를 검사한다. AGENTS.md는 "레포를 봐서는 알 수 없는 것"만 적는 파일이라 기준에 안 맞는다.

### 결정 (재논의 금지)

- **라벨은 영어 고정.** 기각: ① PRD대로 한국어 고정 — 영어 사용자에게 같은 문제가 뒤집혀 생김 ② 대화 언어 따라가기 — 그림마다 라벨이 달라지고 저장된 `.excalidraw`끼리 안 맞음 ③ 의미만 적고 언어는 에이전트 재량 — 초안이 이것이었고, 매번 다른 토큰이 나와 폐기.
- 채울 이름(호출명·이벤트명·결과)은 코드에서 오므로 영어 고정 대상이 아니다.
- 규격 값의 원본은 `docs/canvas-guide.md` 한 벌이다(ADR-0006). 다른 문서는 값을 복사하지 말고 가리킨다.

### 코드 리뷰에서 처리한 것 / 안 한 것

`bcfd0eb`에서 고침: 라벨 5종 고정, `cheatsheet.md`의 빈 `### Design Guide` 표 삭제, `check-mcp-stdio.mjs`의 bun 런타임 인자 누락, Status 라벨을 `resolved`로.

안 고침(판단): `.claude/settings.json`과 AGENTS.md gotcha 2줄을 스코프 크립으로 지적받았으나, 셋 다 세션 중 사용자가 직접 지시한 것이다. `src/index.ts`의 `canvasGuide();` 이름이 접근자처럼 읽힌다는 지적은 남아 있다 — 고치려면 `assertCanvasGuideReadable()` 류로 개명.

### 확인 방법

문서만 바뀌므로 `npm test`는 무관하다. 전부 끝나면 아래 grep이 이 파일, ADR-0012(기각지 설명에 한국어 초안을 인용), `review.md`·`review-02-handoff.md`(날짜 박힌 검수 기록 — 당시 문자열을 그대로 둔다)를 제외하고 비어야 한다. 개념명으로 쓴 "근거 없음"(spec.md 86·137행 등 산문)은 남는 게 맞으므로 패턴을 인용 형태로 좁혔다.

```
grep -rn '\[동기\]\|\[비동기\]\|응답: 결과\|근거 없음: \|`추론`\|`근거 없음`' .scratch/archdraw-skill docs/adr CONTEXT.md
```

### 이후

09는 닫혔다. 다음 구현은 순서표 2단계의 [03 판단 스킬 본문](03-archdraw-skill-body.md)이며, 03은 SKILL.md·`references/canvas-ops.md`가 규격 값을 복사하지 않고 `guide://canvas`를 가리키게 하는 몫을 갖는다.

---

## 사후 검수에서 나온 결함 (2026-09-23)

Status는 그대로 뒀다. 아래 항목은 남은 이슈(03~08)를 다 구현해도 해소되지 않는다. 01 쪽 결함은 [01 Comments](01-plugin-skeleton.md) 같은 날짜 항목에 있다.

1. **[높음] CLI 폴백 채널(`npx skills add`)에는 규격을 읽을 통로가 없다.** 원본은 한 벌이지만 전달 경로는 MCP `instructions`와 `guide://canvas`뿐이고, CLI에는 규격을 출력하는 명령이 없다. 그런데 `canvas-ops.md:9`는 CLI 채널에도 "그리기 전에 `guide://canvas`를 읽어라"고 한다. 그 결과 이 채널의 에이전트는 박스 크기·간격·선 라벨(ADR-0012)을 모른 채 그린다. 02·03·04~08 어디에도 이 작업이 없다. 해결 방향: `canvas-guide.ts`를 재사용해 md 전문을 출력하는 `guide` CLI 명령을 만들고, `canvas-ops.md` 대응표에 한 행을 추가한다.
2. **[낮음] 요약 절과 본문이 같은 값을 두 번 적는다.** md 안에서 200x60은 12·51·73행, 좌표 공식은 14·45행, `fillStyle`은 16·74·162행에 나온다. 와이어 검사는 앞 512자에 값이 있는지만 본다. 그래서 본문만 고치고 요약에 옛 값이 남아도 테스트를 통과한다.
3. **[낮음] 점선의 툴 파라미터(`strokeStyle: "dashed"`)가 md에 없다.** 툴은 `dotted`도 받으므로 에이전트가 파라미터 값을 짐작해야 한다.

보류: npm 게시본 0.1.0에는 09 작업이 들어 있지 않다. 다음 게시 때 해소된다(01 Comments 참조).
