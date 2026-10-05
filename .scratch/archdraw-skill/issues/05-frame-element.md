# 05: frame 요소 지원 — 그림 하나 = frame 하나

> 기술 검증 완료(2026-09-20, 코드 확인): 프론트 `scene.ts`는 이미 frame을 스켈레톤 변환에서 제외하고 `restoreElements`에 그대로 넘긴다. frame은 프론트 수정 없이 그려지며, 막는 곳은 서버 타입 목록 `ExcalidrawElementType`(frame 없음)과 MCP 입력 스키마다. frame 자체에는 프론트 수정이 필요 없다. 이 이슈의 프론트 수정은 아래 글꼴 항목에 있다(라벨 글꼴 결함, 글꼴 연결, 새 글씨의 기본값 — 2026-10-04).
>
> 검수(2026-10-05 그릴, 코드 대조): frame 삭제, 자동 확장의 범위, 기본 글꼴(Nunito로 정했다. Pretendard 시험은 하지 않는다), `describe`의 frame 밖 묶음을 정했다. MCP 스키마, 글꼴 기본값의 위치, export 라벨의 `frameId`를 코드에 맞게 고쳤다.

**What to build:** 에이전트가 그림을 그릴 때 요소들을 frame 하나로 감싸고 frame 이름을 그림 제목으로 쓴다. 사용자가 브라우저에서 frame을 끌면 그림이 통째로 움직인다. `describe`가 frame별 요소와 요소 수를 보여 준다. "안 그림" 줄의 위치, 과밀 세기, "한 그림에 한 종류" 판정은 이 수단을 쓰는 스킬 규칙이고 03에서 이미 적었다(`SKILL.md`, `references/zoom-levels.md`의 Crowding 절). 이 이슈에서 만들지 않는다.

- 요소 타입 목록에 `frame` 추가 + 기본값. 현재는 타입에 `frameId` 칸만 있고 frame 자체는 없다.
- MCP 입력에 `frameId`(string|null)와 `name`(string)을 연다(2026-10-05 코드 확인). `mcp-dispatch.ts`의 zod `ElementSchema`와 MCP 툴 JSON 스키마에 두 칸이 없어 버려진다. 지금은 MCP로 자식을 frame에 넣을 수 없다. REST 스키마(`server.ts`의 `CreateElementSchema`)는 `.passthrough()`라서 CLI 경로는 통과한다.
- CLI `add`·`apply`, MCP create/batch로 frame을 만들고 자식 요소를 넣을 수 있다.
- `describe`가 frame과 그 자식을 그림 단위로 묶어 보여준다. frame마다 이름과 요소 수가 나온다. 어느 frame에도 없는 요소(사용자 표시, 초안 등)는 맨 끝의 "frame 밖" 묶음에 나온다(2026-10-05 그릴). 숨기지 않고, 가까운 frame에 넣지도 않는다 — 서버가 추측하지 않는다.
- group + 제목 텍스트 대안은 기각됐다(스펙 §7-6, [ADR-0008](../../../docs/adr/0008-frame-is-the-drawing-unit.md)).
- frame 자동 확장(2026-09-20 그릴 Q4 (a), drawio-mcp `shared/normalize-model.js` 관행): 서버가 frame을 만들거나 frame에 자식을 넣을 때 자식이 frame 경계 밖으로 나가면 frame을 자식이 들어오도록 키운다. 줄이지 않고 자식은 옮기지 않는다(사용자가 옮긴 배치 유지, 일부러 둔 여백 유지). 멱등 — 이미 들어 있으면 아무것도 안 바뀐다. 이유: Excalidraw frame은 밖으로 나간 자식을 잘라 그리므로 스크린샷에서 안 보여 에이전트가 못 잡는다. 서버 생성·수정 경로에만 적용하고 브라우저에서 사용자가 자식을 밖으로 끄는 것은 건드리지 않는다. 범위(2026-10-05 그릴):
  1. 자식을 만들 때와, 서버 경로로 자식의 위치·크기·`frameId`를 바꿀 때(`update_element`, CLI `apply`의 update) 모두 적용한다.
  2. 키울 때 자식과 frame 테두리 사이에 여백 40을 둔다. 여백은 키울 때만 쓴다. 이미 안에 있는 자식은 테두리와 가까워도 frame을 바꾸지 않는다.
  3. 크기 없이 만든 frame은 서버가 그 frame의 자식 범위 + 여백 40으로 크기를 정한다. 에이전트는 계산하지 않는다.
- frame 삭제(2026-10-05 그릴, [ADR-0008](../../../docs/adr/0008-frame-is-the-drawing-unit.md)): 서버 경로로 frame을 지우면 `frameId`가 그 frame인 자식도 같이 지운다. frame만 지울 경우가 없고(그림 하나 = frame 하나), 남은 자식의 `frameId`가 없는 frame을 가리키면 프론트 `assertScenePreserved`(`frontend/src/utils/scene.ts`)가 `Missing frame` 에러로 씬 갱신을 거부한다. 지금 `DELETE /api/elements/:id`는 자식을 그대로 둔다. 서버는 묻지 않는다. 미저장 그림을 지우기 전에 1회 묻는 것은 스킬 규칙이고 06 담당이다([ADR-0010](../../../docs/adr/0010-server-reports-save-state-skill-never-asks.md)).
- export의 라벨 텍스트(2026-10-05 코드 확인): `src/core/expand-elements.ts`가 만드는 박스·화살표 라벨 텍스트는 `frameId: null` 고정이다. 컨테이너의 `frameId`를 따르게 한다. 아니면 내보낸 파일에서 frame 안 박스의 라벨이 frame 밖 요소가 된다.
- `link` 칸 개방(2026-09-20 그릴 Q1 (a), [ADR-0008](../../../docs/adr/0008-frame-is-the-drawing-unit.md)): 그림 참조는 박스 요소의 `link`에 `?element=<대상 frame id>`로 적는다. 업스트림은 타입에 `link`가 있고 `expand-elements.ts`가 통과시키지만, MCP 툴 JSON 스키마와 `mcp-dispatch.ts`의 zod `ElementSchema`가 `link`를 받지 않아 버린다. `create_element`·`batch_create_elements`·`update_element` 입력에 `link`(string|null)를 연다. 참조를 쓰는 쪽은 03, 저장·재로드 보존은 06.
- 글꼴 기본값(스펙 §7-9, 2026-10-04 그릴로 다시 정함 — 구 "Helvetica(2), 고정폭 안 씀"은 폐기. Excalidraw 화면이 Helvetica에 "old" 표시를 붙인다). 조건은 "한글과 영어 둘 다 읽기 좋은 글꼴"이다. 순서대로 한다:
  1. **결함을 먼저 고친다.** 박스 라벨과 화살표 라벨에 지정한 `fontFamily`가 화면에 적용되지 않는다(독립 텍스트에만 적용된다). 서버 응답에는 값이 있어 원인은 화면 쪽 변환으로 보인다(`frontend/src/utils/scene.ts`의 `convertToExcalidrawElements` 호출 근처). 원인(2026-10-05 코드로 확정, 재현은 구현 때 인수로 한다): 서버의 `convertTextToLabel`(`src/core/normalize.ts`)이 라벨을 `label: {text}`로만 만들고 `fontFamily`는 컨테이너에 남긴다. Excalidraw 0.18.1의 `bindTextToContainer`(`data/transform.ts`)는 `label` 안의 속성만으로 라벨 텍스트를 만들어서 컨테이너의 `fontFamily`를 읽지 않는다. 고칠 방향: 라벨의 `fontFamily`가 `label` 안에 들어가게 한다. 라벨을 만드는 곳은 두 곳이다 — 생성의 `convertTextToLabel`과 수정의 `prepareElementUpdate`(같은 파일). `fontSize`도 같은 구조이므로 같이 확인한다.
  2. **기본 글꼴은 Nunito(6)다**(2026-10-05 그릴. 구 "Pretendard를 연결하는 시험"은 하지 않는다). Pretendard는 Excalidraw 0.18.1에 없다. 넣는 방법은 둘뿐인데 둘 다 기각했다: 라이브러리를 고치면 업스트림을 올릴 때마다 다시 고친다 / 화면에서 Nunito의 이름에 Pretendard 파일을 연결하면 글꼴 메뉴의 이름, 다른 곳에서 연 파일과 캔버스의 글꼴이 서로 다르다. 서버 코드와 스킬로는 할 수 없다 — 서버는 글꼴을 번호로만 저장하고 글자는 브라우저가 그린다. Excalidraw에 든 글꼴에는 한글이 없어 한글은 브라우저가 시스템 글꼴로 그린다(스펙 7-9의 견본 확인). 한글이 스크린샷에서 읽기 나쁘면 그때 Pretendard를 다시 검토한다.
  3. **코드와 계약 메모지는 고정폭 글꼴**이다(Comic Shanns(8)로 정했다 — 2026-10-05 그릴. 규칙은 하나다: Excalidraw 0.18.1이 `deprecated`로 표시한 글꼴(Virgil, Helvetica, Cascadia — 화면의 "old" 표시)은 쓰지 않는다. Cascadia는 이 규칙으로 기각했다. 실제 모양은 인수의 스크린샷으로 본다). 서버는 어느 글자가 코드인지 모르므로 이 규칙은 규격 원본 `docs/canvas-guide.md`에 적는다([ADR-0006](../../../docs/adr/0006-canvas-guide-single-source-via-mcp.md)): 기본 글꼴의 이름과 고정폭 글꼴의 이름. `plugin/skills/archdraw/references/canvas-ops.md`의 `fontFamily` 예시(`"helvetica"`, 폐기된 글꼴)와 MCP 툴 설명의 글꼴 목록도 맞춘다.
  4. 기본값을 Nunito(6)로 맞춘다. 고칠 곳은 세 층이다(2026-10-05 코드 확인): (가) 화면 — 캔버스는 프론트의 `convertToExcalidrawElements`가 기본값을 정한다. 서버의 `prepareElement`(`src/core/normalize.ts`)는 `fontFamily`가 없으면 넣지 않는다. 서버가 생성 때 넣는다(2026-10-05): `fontFamily`가 없는 텍스트와 라벨에 `prepareElement`가 6을 넣는다. 서버의 요소 데이터, 화면, export가 같은 값을 가지고, 1번의 라벨 수정과 같은 곳이다. (나) export — `src/core/expand-elements.ts`의 텍스트·라벨 생성부 두 곳(`?? 1`). 이 파일은 export 전용이라(`scene-io.ts`, `share-url.ts`) 여기만 고치면 화면은 손글씨로 남는다. (다) 브라우저에서 사용자가 새로 쓰는 글씨 — 초기 appState `currentItemFontFamily`. 프론트는 지금 초기 appState에 `theme`만 넘겨 손글씨(Excalifont)가 기본이다(2026-09-20 코드 확인).
  이 이슈에 둔 이유: frame과 같은 요소 기본값 층이고 프론트를 같이 보는 이슈라서.

**Blocked by:** 01 (플러그인 골격), 04 (캔버스 세션 — CLI 인수는 `--session`이 필수인 명령 형태로 실행하고, 두 이슈가 `mcp-tools.ts`·`mcp-dispatch.ts`·`server.ts`·CLI를 같이 고친다. 2026-10-05)

**Status:** ready-for-agent

- [ ] CLI로 frame 하나와 자식 박스 둘을 만들면 브라우저에 이름 붙은 frame 안에 박스가 보인다
- [ ] MCP `batch_create_elements` 한 번으로 `name`이 있는 frame과 `frameId`가 그 frame인 박스 둘을 만들면 요소 데이터에 `name`과 `frameId`가 남고 브라우저에 같은 결과가 보인다
- [ ] 브라우저에서 frame을 끌면 자식이 같이 움직이고, `describe` 좌표가 그걸 반영한다
- [ ] `describe` 출력에서 어떤 요소가 어느 그림(frame)에 속하는지 읽히고, frame마다 요소 수가 있다
- [ ] frame 둘과 어느 frame에도 없는 요소 하나가 있을 때 `describe`의 맨 끝 "frame 밖" 묶음에 그 요소가 나온다
- [ ] export한 `.excalidraw`를 excalidraw.com에서 열면 frame이 유지된다. 파일 안에서 frame 안 박스의 라벨 텍스트의 `frameId`가 박스와 같다
- [ ] frame 경계 밖 좌표로 자식을 넣으면 frame이 자식을 포함하도록 커지고, 자식 좌표는 그대로다. 커진 뒤 자식과 frame 테두리 사이가 40 이상이다. 이미 안에 있는 자식을 다시 넣으면 frame 크기가 안 바뀐다(테두리와 40보다 가까워도)
- [ ] `update_element`로 자식을 frame 밖 좌표로 옮기면 frame이 커지고 스크린샷에서 자식이 잘리지 않는다
- [ ] 크기 없이 만든 frame이 자식 범위 + 여백 40의 크기를 가진다
- [ ] 자식이 있는 frame을 서버 경로로 지우면 자식도 없어지고, 다른 frame과 그 자식은 그대로이며, 브라우저가 에러 없이 갱신된다
- [ ] 박스 라벨과 화살표 라벨에 `fontFamily`를 지정하면 화면의 실제 요소 데이터에 그 값이 있고 스크린샷에서 그 글꼴로 보인다(결함 수정)
- [ ] `fontFamily` 없이 만든 텍스트·박스 라벨·화살표 라벨의 실제 요소 데이터의 `fontFamily`가 Nunito(6)이고, export한 파일도 같고, 브라우저에서 새로 친 글씨도 같다. 한글 + 영어 라벨이 스크린샷에서 읽힌다
- [ ] 코드와 계약 메모지의 글자는 고정폭 글꼴 Comic Shanns다(요소 데이터의 `fontFamily`가 8). 스크린샷에서 코드 글자가 읽힌다
- [ ] `docs/canvas-guide.md`에 기본 글꼴과 고정폭 글꼴의 이름이 있고, `canvas-ops.md`와 MCP 툴 설명의 글꼴 예시가 그것과 맞는다
- [ ] frame B 안에 박스가 있을 때 `create_element`로 `link: "?element=<B의 id>"`를 준 박스를 만들면 요소 데이터에 그 `link`가 남고, 브라우저에서 박스의 링크 아이콘을 누르면 화면이 B로 이동한다. `update_element`로 `link`를 바꾸거나 `null`로 지울 수 있다
- [ ] 기존 `npm test` 통과


## 검증 방법과 결과 기록 (R10)

구현 담당 에이전트가 CLI·MCP로 만든 frame·자식의 실제 요소 데이터와 `describe`의 소속 요약을 대조한다. frame 표시·제목·자식 포함은 스크린샷으로 확인한다. frame 드래그와 외부 편집기에서 파일 열기는 실제 브라우저 동작으로 확인하고 전후 데이터·화면 결과를 남긴다. 글꼴 값은 실제 요소 데이터로 검사하고 영어·한글 가독성은 화면에서 확인한다. `describe`가 글꼴 값을 제공한다고 가정하지 않는다. 스크린샷이 frame의 이름과 테두리를 그리는지는 가정하지 않고 먼저 확인한다 — 프론트는 `exportToBlob`에 화면의 appState를 그대로 넘긴다(2026-10-05 코드 확인, 동작은 미확인).

- [ ] 각 인수 기준의 기대 결과·실제 결과·통과/실패/미시험과 데이터 또는 화면 근거, 기존 테스트 결과를 기록했다.
