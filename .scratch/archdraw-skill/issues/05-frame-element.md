# 05: frame 요소 지원 — 그림 하나 = frame 하나

> 결정은 다 끝났다(2026-10-07). 세 슬라이스 A·B·C로 나눈다. 각 슬라이스는 자기 인수를 실제 데이터와 브라우저로 확인하고 커밋한다. 구현 중 새 결정이 필요해 보이면 멈추고 묻는다 — 이 문서에 없는 규칙을 만들지 않는다.

**What to build:** 에이전트가 그림을 그릴 때 요소들을 frame 하나로 감싸고 frame 이름을 그림 제목으로 쓴다. 사용자가 브라우저에서 frame을 끌면 그림이 통째로 움직인다. `describe`가 frame별 요소와 요소 수를 보여 준다. 박스의 링크 아이콘을 누르면 같은 탭에서 참조하는 그림으로 이동한다. 라벨에 지정한 글꼴이 화면에 보이고, 안 주면 한글·영어 모두 읽기 좋은 기본 글꼴과 크기가 들어간다. "안 그림" 줄의 위치, 과밀 세기, "한 그림에 한 종류" 판정은 이 수단을 쓰는 스킬 규칙이고 03에서 이미 적었다. 이 이슈에서 만들지 않는다.

**Blocked by:** 01 (플러그인 골격), 04 (캔버스 세션 — CLI는 `--session`이 필수, 두 이슈가 `mcp-tools.ts`·`mcp-dispatch.ts`·`server.ts`·CLI를 같이 고친다). 둘 다 완료.

**Status:** ready-for-agent

## 공통

배경 사실 둘(아래 규칙이 기대는 것, 2026-10-06 코드 확인):

- 화면은 씬 적용에 실패하면 멈춘다. 프론트 `assertScenePreserved`(`frontend/src/utils/scene.ts`)가 에러를 내면 `App.tsx`의 `failSceneLoad`가 동기화를 멈추고 "Canvas could not be loaded"를 보인다. 서버가 틀린 데이터를 저장하면 캔버스가 죽는다. 그래서 서버가 입구에서 거부한다.
- 사용자가 캔버스를 만지면 화면이 전체 요소를 `POST /api/elements/sync`로 보내고 서버 저장소를 통째로 바꾼다. 그 뒤 서버의 요소는 에이전트가 보낸 모양(`label: {text}`)이 아니라 Excalidraw의 실제 요소다(라벨은 `containerId`가 있는 별도 텍스트). 인수는 동기화 전후 둘 다 본다.

규칙의 위치: 자동 확장·`frameId` 검사·frame 이동·삭제는 REST 층(`src/server.ts`)에 둔다. MCP·CLI 모두 REST를 거치고, `src/core/geometry.ts`의 `alignElements`·`distributeElements`·`duplicateElements`도 REST를 거치므로 같은 규칙을 자동으로 따른다.

범위 밖(2026-10-07 그릴 Q7): `create_from_mermaid`가 만든 요소는 브라우저가 변환하므로 frame에 넣지 않고 글꼴·크기 기본값도 받지 않는다. 업스트림 툴이고 archdraw 스킬은 쓰지 않는다. 쓰게 되면 그때 이슈를 낸다. group + 제목 텍스트 대안은 기각됐다(스펙 §7-6, [ADR-0008](../../../docs/adr/0008-frame-is-the-drawing-unit.md)).

코드 확인 방법: `npm run build` 뒤 `ARCHDRAW_BIN=<레포>/dist/bin.js`를 둔 셸에서 호스트를 다시 띄운다(AGENTS.md gotcha). 비어 있으면 npm 게시본이 돌아 고친 코드가 안 보인다. 레포 서버만 띄우려면 `node dist/bin.js session start --project .`가 URL을 준다.

## 슬라이스 A — frame

**What to build:** 에이전트가 CLI·MCP로 이름 붙은 frame을 만들고 그 안에 박스·화살표·텍스트를 넣는다. 자식이 경계 밖이면 frame이 자라고, frame을 옮기면 자식이 따라가고, frame을 지우면 자식도 지워진다. 틀린 소속은 서버가 거부해 캔버스가 멈추지 않는다. `describe`가 frame별로 묶어 보여 주고, 저장 파일에서도 frame과 라벨의 소속이 유지된다.

**Blocked by:** None (can start immediately)

**Status:** resolved (2026-10-08 — 인수 16개 통과, 2개 일부. 결과는 맨 아래 "슬라이스 A 결과")

규칙:

- **타입과 스키마.** 요소 타입 목록(`ExcalidrawElementType`)에 `frame`을 더하고 기본값을 둔다. MCP 입력(`mcp-dispatch.ts`의 zod `ElementSchema`와 MCP 툴 JSON 스키마)에 `frameId`(string|null)와 `name`(string)을 연다 — 지금은 두 칸이 없어 버려진다(2026-10-05 코드 확인). REST 스키마는 `.passthrough()`라 CLI 경로는 이미 통과한다. frame을 만드는 방법(`type: "frame"`, `name`, 자식의 `frameId`)을 `plugin/skills/archdraw/references/canvas-ops.md`의 Element format과 `src/core/mcp-tools.ts`의 툴 설명에 적는다.
- **`frameId` 검사**(Q1): 서버 경로로 받은 `frameId`가 없는 id, frame이 아닌 요소의 id, 또는 frame 자신에 붙은 값(frame 안의 frame)이면 거부하고 에러에 그 id를 적는다. batch는 하나라도 틀리면 전체 거부, 아무것도 만들지 않는다. 같은 batch 안에서 만드는 frame은 순서와 관계없이 유효하다. 조용히 지우지 않는다 — 에이전트의 실수를 숨기고, 그대로 두면 `Missing frame`으로 캔버스가 멈춘다.
- **빈 frame 거부**(Q2): 크기도 자식도 없는 frame은 거부하고 에러에 "크기를 주거나 같은 batch에 자식을 넣어라"를 적는다. 기본 크기를 주지 않는다 — 0x0 frame은 라이브러리 `restoreElements`가 버려서 자식이 `Missing frame`이 되고, 기본 크기는 첫 자식 위치에 따라 빈 영역이 큰 frame을 남긴다(자동 확장은 줄이지 않는다).
- **자동 확장**(2026-09-20 그릴, drawio-mcp `shared/normalize-model.js` 관행): 서버가 frame을 만들거나 자식을 넣거나 서버 경로로 자식의 위치·크기·`frameId`를 바꿀 때, 자식이 frame 경계 밖이면 frame을 자식이 들어오도록 키운다. 줄이지 않고 자식은 옮기지 않는다(사용자가 옮긴 배치와 일부러 둔 여백 유지). 멱등 — 이미 안에 있으면 아무것도 안 바뀐다. 키울 때만 자식과 테두리 사이에 여백 40을 둔다. 이미 안에 있는 자식은 테두리와 가까워도 frame을 바꾸지 않는다. 크기 없이 만든 frame은 서버가 자식 범위 + 여백 40으로 크기를 정한다. 브라우저에서 사용자가 자식을 밖으로 끄는 것은 건드리지 않는다. 이유: Excalidraw frame은 밖으로 나간 자식을 잘라 그려 스크린샷에서 안 보이고 에이전트가 못 잡는다.
- **자식의 범위**(Q5): 박스는 `x`·`y`·`width`·`height`. 화살표·선은 `x`·`y` + `points`의 범위. 텍스트는 `width`·`height`가 있으면 그 값, 없으면(브라우저가 아직 재지 않은 에이전트 생성 텍스트) 추정한다 — `src/core/expand-elements.ts`의 추정식(글자당 0.6×`fontSize`, 줄 높이 1.25)을 함수 하나로 빼서 export와 자동 확장이 같이 쓰고, 한글(완성형 음절·자모)은 글자당 1.0×`fontSize`로 센다. 틀린 만큼은 여백 40이 받고, 브라우저가 잰 값이 오면 그 값이 추정을 덮는다. 기각: 좌표만 보기(긴 텍스트가 오른쪽에서 잘림), 브라우저 측정 기다리기(사용자가 안 만지거나 브라우저가 없으면 영영 안 옴), 서버에서 글꼴 파일로 재기(한글은 시스템 글꼴이라 어차피 추정).
- **frame 이동·크기**(Q4): 서버 경로로 frame의 위치를 바꾸면 `frameId`가 그 frame인 자식도 같은 만큼 옮기고, 자식에 묶인 화살표는 서버가 다시 잇는다 — 브라우저에서 사용자가 frame을 끌 때와 같은 결과. 크기는 자식 범위 + 여백 40보다 작아지지 않는다(그 값으로 자른다). "frame 테두리만 옮기고 자식은 두는" 요구는 없다(그림 하나 = frame 하나).
- **frame 삭제**(2026-10-05 그릴, ADR-0008): 서버 경로로 frame을 지우면 `frameId`가 그 frame인 자식도 같이 지운다. 지금 `DELETE /api/elements/:id`는 자식을 그대로 둔다. 화면에 알릴 때 자식 삭제를 먼저, frame을 마지막에 보낸다 — 반대면 화면이 `Missing frame`으로 잠깐 실패한다. 서버는 묻지 않는다. 미저장 그림을 지우기 전에 1회 묻는 것은 스킬 규칙이고 06 담당([ADR-0010](../../../docs/adr/0010-server-reports-save-state-skill-never-asks.md)).
- **라벨 텍스트의 `frameId`**(Q6): Excalidraw 0.18.1의 `bindTextToContainer`는 컨테이너의 `frameId`를 라벨 텍스트에 복사하지 않아 `null`로 남는다. 라이브러리는 고치지 않는다. 프론트가 서버로 보내기 직전(`syncToBackend`)에 `containerId`가 있는 텍스트의 `frameId`를 컨테이너의 `frameId`로 채운다. export가 만드는 라벨 텍스트(`expand-elements.ts`, 지금 `frameId: null` 고정)도 컨테이너를 따른다. `describe`는 `containerId`가 있는 텍스트를 컨테이너의 frame에 넣고 요소 수에 세지 않는다(라벨은 박스의 일부지 요소가 아니다). 기각: `describe`만 고치기(저장·export마다 같은 예외를 또 적어야 함).
- **`describe`**: frame과 자식을 그림 단위로 묶어 보여 준다. frame마다 이름과 요소 수. 어느 frame에도 없는 요소는 맨 끝의 "frame 밖" 묶음에 나온다. 숨기지 않고, 가까운 frame에 넣지도 않는다 — 서버가 추측하지 않는다.

인수:

- [x] CLI로 frame 하나와 자식 박스 둘을 만들면 브라우저에 이름 붙은 frame 안에 박스가 보인다. 스크린샷에도 frame의 이름과 테두리가 그려진다(프론트는 `exportToBlob`에 화면의 appState를 그대로 넘긴다 — 가정하지 말고 먼저 확인한다)
- [ ] MCP `batch_create_elements` 한 번으로 `name`이 있는 frame과 `frameId`가 그 frame인 박스 둘을 만들면 요소 데이터에 `name`과 `frameId`가 남고 브라우저에 같은 결과가 보인다
- [x] 없는 id, 박스의 id, frame 안의 frame을 `frameId`로 주면 서버가 거부하고 에러에 그 id가 있다. batch 안에 하나라도 있으면 전체가 거부되고 아무것도 안 만들어진다. frame이 자식 뒤에 오는 batch는 통과한다. 캔버스는 멈추지 않는다
- [x] 크기도 자식도 없는 frame을 만들면 서버가 거부하고, 에러에 크기 또는 자식을 넣으라는 말이 있다. 캔버스는 멈추지 않는다
- [x] 크기 없이 만든 frame이 자식 범위 + 여백 40의 크기를 가진다
- [x] frame 경계 밖 좌표로 자식을 넣으면 frame이 자식을 포함하도록 커지고, 자식 좌표는 그대로다. 커진 뒤 자식과 테두리 사이가 40 이상이다. 이미 안에 있는 자식을 다시 넣으면 frame 크기가 안 바뀐다(테두리와 40보다 가까워도)
- [x] `update_element`로 자식을 frame 밖 좌표로 옮기면 frame이 커지고 스크린샷에서 자식이 잘리지 않는다
- [x] frame 오른쪽 끝 가까이에 `width` 없는 긴 한글 텍스트(예: "안 그림: …" 20자)를 넣으면 frame이 추정 폭만큼 커지고, 브라우저 스크린샷에서 글자가 잘리지 않는다. 화살표의 꺾인 점이 frame 밖이면 그만큼 커진다
- [ ] `update_element`로 frame의 `x`·`y`를 바꾸면 자식 박스와 화살표가 같은 만큼 움직이고, 브라우저에서 frame을 끌었을 때와 같은 모양이다. frame의 `width`를 자식 범위보다 작게 주면 자식 범위 + 여백 40에서 멈춘다
- [x] `align_elements`로 frame 안 박스를 정렬해 하나가 경계 밖으로 나가면 frame이 커진다(REST를 거치므로 같은 규칙)
- [x] 브라우저에서 frame을 끌면 자식이 같이 움직이고, `describe` 좌표가 그걸 반영한다
- [x] 자식이 있는 frame을 서버 경로로 지우면 자식도 없어지고, 다른 frame과 그 자식은 그대로이며, 브라우저가 에러 없이 갱신된다
- [x] `describe` 출력에서 어떤 요소가 어느 그림(frame)에 속하는지 읽히고, frame마다 요소 수가 있다
- [x] frame 둘과 어느 frame에도 없는 요소 하나가 있을 때 `describe`의 맨 끝 "frame 밖" 묶음에 그 요소가 나온다
- [x] frame 안에 라벨 있는 박스 둘을 만들고 브라우저에서 박스 하나를 살짝 옮겨 동기화시킨 뒤, 서버 데이터에서 두 라벨 텍스트의 `frameId`가 박스와 같고, `describe`의 그 frame 요소 수가 동기화 전후 같으며(라벨은 세지 않는다), "frame 밖" 묶음에 라벨이 없다
- [x] export한 `.excalidraw`를 excalidraw.com에서 열면 frame이 유지된다. 파일 안에서 frame 안 박스의 라벨 텍스트의 `frameId`가 박스와 같다
- [x] `canvas-ops.md`의 Element format과 MCP 툴 설명에 frame 만드는 법(`type: "frame"`, `name`, 자식의 `frameId`)이 있다
- [x] 기존 `npm test` 통과

## 슬라이스 B — 그림 참조 링크와 클릭 이동

**What to build:** 에이전트가 박스에 다른 그림(frame)의 참조를 `link`로 적는다. 사용자가 브라우저에서 그 박스의 링크 아이콘을 누르면 새 탭이 열리는 대신 같은 탭에서 캔버스가 그 frame으로 이동한다.

**Blocked by:** 슬라이스 A (참조 대상이 frame이다)

**Status:** resolved (2026-10-08 — 인수 4개 통과. 결과는 맨 아래 "슬라이스 B 결과")

규칙:

- **`link` 칸 개방**(2026-09-20 그릴, ADR-0008): 그림 참조는 박스 요소의 `link`에 `?element=<대상 frame id>`로 적는다. ID 기반이라 이름 변경·복사에 견딘다. 업스트림은 타입에 `link`가 있고 export가 통과시키지만, MCP 툴 JSON 스키마와 zod `ElementSchema`가 `link`를 받지 않아 버린다(2026-10-07 `update_element`로 실측: `link: null`로 돌아옴). `create_element`·`batch_create_elements`·`update_element` 입력에 `link`(string|null)를 연다. 참조를 쓰는 쪽은 03, 저장·재로드 보존은 06.
- **클릭 이동은 프론트가 구현한다**(Q3, 2026-10-07 시연으로 확인): Excalidraw 0.18.1의 `isElementLink`는 `new URL()`로 주소를 읽어 상대 주소 `?element=…`를 요소 링크로 인식하지 못하고 새 탭을 연다. `<Excalidraw>`에 `onLinkOpen`을 넣는다. 시연 코드가 `frontend/src/App.tsx`에 있다(미커밋, `PROTOTYPE` 주석) — 주석을 정리하고 그대로 쓴다. 결정을 담은 부분(시연에서):

  ```tsx
  onLinkOpen={(element, event) => {
    const match = element.link?.match(/[?&]element=([^&#]+)/)
    if (!match) return                       // 보통 주소는 Excalidraw 기본 동작
    const target = api.getSceneElements().find((el) => el.id === decodeURIComponent(match[1]))
    if (!target) return                      // 없는 id도 기본 동작에 맡긴다
    event.preventDefault()
    api.scrollToContent([target], { fitToContent: true, animate: true })
  }}
  ```

  기각: 클릭 인수를 지우고 데이터로만 두기 — 링크 아이콘은 그대로 남아 누르면 같은 캔버스가 새 탭에 열려 깨진 것처럼 보인다.

인수:

- [x] frame B 안에 박스가 있을 때 `create_element`로 `link: "?element=<B의 id>"`를 준 박스를 만들면 요소 데이터에 그 `link`가 남는다. `update_element`로 `link`를 바꾸거나 `null`로 지울 수 있다
- [x] 브라우저에서 그 박스의 링크 아이콘을 누르면 같은 탭에서 화면이 B로 이동하고 새 탭이 열리지 않는다
- [x] 없는 id를 가리키는 링크와 보통 `https://` 링크는 Excalidraw 기본 동작 그대로다(새 탭)
- [x] 기존 `npm test` 통과

## 슬라이스 C — 글꼴과 크기 기본값

**What to build:** 에이전트가 라벨에 지정한 글꼴·크기가 화면과 저장 파일에 그대로 보인다. 안 주면 한글·영어 모두 읽기 좋은 Nunito와 박스 16·화살표 14가 들어가고, 화면·저장 파일·`describe`·사용자가 새로 치는 글씨가 같은 값이다. 코드와 계약 메모지는 고정폭 Comic Shanns다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

규칙(스펙 §7-9. 구 "Helvetica(2), 고정폭 안 씀"은 폐기 — Excalidraw 화면이 Helvetica에 "old" 표시를 붙인다. 글꼴 조건은 "한글과 영어 둘 다 읽기 좋은 글꼴"):

1. **결함을 먼저 고친다.** 박스 라벨과 화살표 라벨에 지정한 `fontFamily`가 화면에 적용되지 않는다(독립 텍스트에만 적용된다). 원인(2026-10-05 코드로 확정, 재현은 인수로 한다): 서버의 `convertTextToLabel`(`src/core/normalize.ts`)이 라벨을 `label: {text}`로만 만들고 `fontFamily`는 컨테이너에 남긴다. Excalidraw 0.18.1의 `bindTextToContainer`는 `label` 안의 속성만으로 라벨 텍스트를 만들어 컨테이너의 `fontFamily`를 읽지 않는다. 고치는 곳 넷:
   - 라벨의 `fontFamily`·`fontSize`가 `label` 안에 들어가게 한다. 라벨을 만드는 곳은 생성의 `convertTextToLabel`과 수정의 `prepareElementUpdate`(같은 파일) 두 곳.
   - REST 스키마 `CreateElementSchema`·`UpdateElementSchema`(`src/server.ts`)는 `label: z.object({text})`라서 `label.fontFamily`를 지운다. 두 스키마와 `src/types.ts`·`frontend/src/utils/scene.ts`의 `label` 타입을 연다.
   - 라벨의 글자만 수정하면 PUT의 얕은 병합이 `label`을 통째로 바꿔 글꼴이 없어진다. 글자만 바꿔도 글꼴·크기는 유지한다.
   - export(`expandElementsForExport`)는 라벨의 글꼴을 컨테이너의 `fontFamily`에서 읽는다. `label` 안의 값을 먼저 읽게 한다.
2. **기본 글꼴은 Nunito(6)**(2026-10-05 그릴). Pretendard는 Excalidraw 0.18.1에 없고, 넣는 두 방법(라이브러리 수정 / Nunito 이름에 Pretendard 파일 연결)은 둘 다 기각했다 — 업스트림 올릴 때마다 다시 고치거나, 글꼴 메뉴 이름과 다른 곳에서 연 파일의 글꼴이 달라진다. 서버는 글꼴을 번호로만 저장하고 글자는 브라우저가 그린다. 한글 조건(2026-10-07 라이브러리 코드·공식 블로그 확인): Excalidraw 0.18.1은 한글 손글씨 글꼴 Xiaolai를 내장하지만 `getFontFamilyFallbacks`가 **Excalifont에만** 붙인다. Nunito·Comic Shanns의 한글은 브라우저가 시스템 글꼴(Mac은 Apple SD Gothic)로 그린다. 이 프로젝트는 사용자의 Mac 브라우저에서 스크린샷을 찍으므로 읽힌다(스펙 7-9의 견본 확인). 한글 글꼴이 없는 기계(CI, 맨 Linux)에서는 네모로 나올 수 있다 — 알고 받아들인 조건이다. Excalifont로 바꾸는 안(한글·영어 다 내장, 어느 기계든 같음)은 손글씨체가 작은 글자에서 덜 읽혀 기각. 폐기 글꼴은 Virgil·Helvetica·Cascadia 셋뿐이고 Nunito·Comic Shanns는 아니다(`FontMetadata`의 `deprecated` 확인). 한글이 스크린샷에서 읽기 나쁘면 그때 Pretendard나 Excalifont를 다시 검토한다.
3. **기본값은 서버가 생성 때 넣는다.** `prepareElement`(`src/core/normalize.ts`)가 `fontFamily` 없는 텍스트·라벨에 6을, `fontSize` 없는 박스 라벨·독립 텍스트에 16, 화살표 라벨에 14를 넣는다(Q8). 서버 데이터·화면·export·`describe`가 같은 값을 가진다. 화면 기본값이 우연히 같아도 서버 기본값은 넣는다 — 데이터에 값이 있어야 export가 추측하지 않는다. 고칠 층은 셋(2026-10-05 코드 확인): (가) 서버 `prepareElement` — 1번의 라벨 수정과 같은 곳. (나) export `src/core/expand-elements.ts`의 텍스트·라벨 생성부 두 곳(`?? 1`, 박스 16·화살표 14). (다) 브라우저에서 사용자가 새로 쓰는 글씨 — 프론트 초기 appState에 `currentItemFontFamily`(지금은 `theme`만 넘겨 손글씨 Excalifont가 기본).
4. **코드와 계약 메모지는 고정폭 Comic Shanns(8)**(2026-10-05 그릴). 규칙은 하나: Excalidraw 0.18.1이 `deprecated`로 표시한 글꼴(Virgil, Helvetica, Cascadia — 화면의 "old")은 쓰지 않는다. 서버는 어느 글자가 코드인지 모르므로 이 규칙은 규격 원본 `docs/canvas-guide.md`에 적는다([ADR-0006](../../../docs/adr/0006-canvas-guide-single-source-via-mcp.md)): 기본 글꼴 이름과 고정폭 글꼴 이름. `plugin/skills/archdraw/references/canvas-ops.md`의 `fontFamily` 예시(`"helvetica"`, 폐기됨)와 MCP 툴 설명의 글꼴 목록도 맞춘다.

이 이슈에 둔 이유: frame과 같은 요소 기본값 층이고 프론트를 같이 보는 이슈라서.

인수:

- [ ] 박스 라벨과 화살표 라벨에 `fontFamily`를 지정하면 화면의 실제 요소 데이터에 그 값이 있고 스크린샷에서 그 글꼴로 보인다(결함 수정)
- [ ] 라벨의 글자만 `update_element`로 바꾼 뒤에도 라벨의 `fontFamily`·`fontSize`가 그대로다
- [ ] `fontFamily` 없이 만든 텍스트·박스 라벨·화살표 라벨의 실제 요소 데이터의 `fontFamily`가 Nunito(6)이고, export한 파일도 같고, 브라우저에서 새로 친 글씨도 같다. 한글 + 영어 라벨이 스크린샷에서 읽힌다
- [ ] `fontSize` 없이 만든 박스 라벨·독립 텍스트는 요소 데이터가 16, 화살표 라벨은 14이고, export한 파일의 값이 화면의 값과 같다
- [ ] 코드와 계약 메모지의 글자는 고정폭 Comic Shanns다(요소 데이터의 `fontFamily`가 8). 스크린샷에서 코드 글자가 읽힌다
- [ ] `docs/canvas-guide.md`에 기본 글꼴과 고정폭 글꼴의 이름이 있고, `canvas-ops.md`와 MCP 툴 설명의 글꼴 예시가 그것과 맞는다
- [ ] 기존 `npm test` 통과

## 검증 방법과 결과 기록 (R10)

구현 담당 에이전트가 CLI·MCP로 만든 frame·자식의 실제 요소 데이터와 `describe`의 소속 요약을 대조한다. frame 표시·제목·자식 포함은 스크린샷으로 확인한다. frame 드래그, 링크 클릭, 외부 편집기에서 파일 열기는 실제 브라우저 동작으로 확인하고 전후 데이터·화면 결과를 남긴다. 글꼴 값은 실제 요소 데이터로 검사하고 영어·한글 가독성은 화면에서 확인한다. `describe`가 글꼴 값을 제공한다고 가정하지 않는다.

- [ ] 슬라이스마다 각 인수 기준의 기대 결과·실제 결과·통과/실패/미시험과 데이터 또는 화면 근거, 기존 테스트 결과를 기록했다.

## Comments

- 2026-10-05 그릴: frame 삭제, 자동 확장 범위, 기본 글꼴 Nunito, `describe`의 frame 밖 묶음.
- 2026-10-06~07 그릴(착수 전 검수에서 나온 8개): Q1 잘못된 `frameId` 거부 / Q2 빈 frame 거부 / Q3 링크 클릭 이동은 프론트 `onLinkOpen`(시연으로 확인, ADR-0008 정정) / Q4 frame 이동은 자식 동반 / Q5 자식 범위 추정 / Q6 라벨 `frameId`를 프론트가 채움(06에 전달) / Q7 mermaid 범위 밖 / Q8 글자 크기 기본값 서버.
- 그릴에서 통한 것: 말로만 설명한 Q3는 세 번 되물었다. 캔버스에 예시를 그리고 동작을 실제로 띄워 보여 주니 바로 결정됐다. 용어(frame, 서버 경로, 라벨)는 먼저 한 줄로 풀고 묻는다. 긴 보고는 거부된다 — 표 하나와 질문 하나.
- 2026-10-08 B 착수 전 판단 4개(사용자 확정): ADR-0008의 코드 사실 문장은 지우고 `onLinkOpen` 부분은 한 줄로 줄임 / MCP 실제 호스트 확인은 02로 / 서버 frame 이동과 브라우저 드래그 모양 비교는 안 함 / A의 임의 결정 7개는 그대로 둠.
- 2026-10-08 슬라이스 A 구현 중 업스트림 결함 발견, 사용자 결정으로 이 슬라이스에서 고침: 서버 경로로 라벨 박스를 수정하면 화면이 라벨 텍스트를 하나 더 만든다(동기화 뒤 서버 데이터에 같은 `containerId` 텍스트 2개). 서버 라벨 글자 변경은 화면에 안 보였다. frame 없는 박스로 재현, 원인 코드는 업스트림 스냅샷과 같다.

## 슬라이스 A 결과 (2026-10-08)

| 인수 | 결과 | 근거 |
|---|---|---|
| CLI frame + 박스 둘, 스크린샷에 이름·테두리 | 통과 | 브라우저, CLI `screenshot`. `exportToBlob`에 화면 appState 그대로 넘김 확인 |
| MCP batch로 `name`·`frameId` 유지, 브라우저 같은 결과 | 일부 | `check-frames` MCP stdio 케이스(실제 `dist`). 실제 호스트(`ARCHDRAW_BIN`)에서는 미확인 → 02 |
| 틀린 `frameId` 거부, batch 전체 거부, 순서 무관, 캔버스 안 멈춤 | 통과 | `check-frames` + 실세션 REST 거부 뒤 브라우저 경고 없음·동기화 정상 |
| 빈 frame 거부 | 통과 | 위와 같음. PUT으로 자식 없는 frame 크기를 0으로 만드는 것도 거부 |
| 크기 없는 frame = 자식 범위 + 40 | 통과 | 테스트 + 브라우저 |
| 경계 밖 자식 → 확장, 안쪽은 불변 | 통과 | 테스트 + 스크린샷 |
| `update`로 자식 밖으로 → 확장, 안 잘림 | 통과 | 스크린샷 |
| 긴 한글 텍스트·화살표 꺾인 점 | 통과 | 스크린샷, 테스트. 텍스트 글자 변경도 추정 폭으로 확장(테스트) |
| `update`로 frame `x`·`y` → 자식 동반, 폭 clamp | 일부 | 테스트 + 스크린샷. "브라우저에서 끌었을 때와 같은 모양" 나란히 비교는 안 함 |
| `align`으로 밖 → 확장 | 통과 | CLI `arrange align` 뒤 `describe` |
| 브라우저에서 frame 끌기 → 자식 동반, `describe` 반영 | 통과 | 브라우저 드래그 뒤 서버 데이터·`describe` |
| 서버 경로 frame 삭제 → 자식 삭제, 다른 frame 유지, 브라우저 에러 없음 | 통과 | 테스트(알림 순서: 라벨 → 박스 → frame) + 실세션 삭제 뒤 경고 없음·동기화 정상 |
| `describe` frame별 묶음·요소 수 | 통과 | 테스트 + 실데이터 |
| frame 밖 묶음 맨 끝 | 통과 | 테스트 + 실데이터 |
| 라벨 `frameId` 동기화 전후 | 통과 | 실세션 frame `lf`: 브라우저 드래그 전후 요소 수 2, 라벨 `frameId` = `lf`, frame 밖 묶음에 라벨 없음 |
| export → excalidraw.com에서 frame 유지, 라벨 `frameId` | 통과 | export 파일의 라벨 `frameId` = 박스. excalidraw.com에 끌어 놓아 frame·박스 표시 확인 뒤 되돌림 |
| `canvas-ops.md`·툴 설명에 frame 만드는 법 | 통과 | 파일 확인 |
| 기존 `npm test` | 통과 | `npm test` 전체(`check-frames` 13개), `npm run test:canvas` 16개, 타입 검사 둘 |

라벨 중복 수정: 서버는 라벨을 바꾸지 않은 수정에서 `label`을 화면에 보내지 않고, 바뀐 라벨은 저장된 옛 라벨 텍스트를 지운다. 프론트 `reconcileAgentLabels`는 같은 라벨이면 버리고 다른 라벨이면 옛 텍스트를 바꾼다(재로드 경로). 회귀 테스트: `tests/browser/scene-reload.spec.mjs` 마지막, `check-frames`의 라벨 케이스.

남은 위험: 사용자가 브라우저에서 라벨 글자를 고치고 자동 동기화 전에 에이전트가 같은 박스의 라벨을 바꾸면 에이전트 값이 이긴다.

## 슬라이스 B 결과 (2026-10-08)

| 인수 | 결과 | 근거 |
|---|---|---|
| MCP `create`·`update`·`batch`로 `link` 유지·변경·`null` | 통과 | `check-frames` MCP stdio 케이스(실제 `dist`). CLI `add`·`update`도 실세션에서 `link` 유지 |
| 링크 아이콘 → 같은 탭에서 B로 이동 | 통과 | 실세션 `e46ce6` 브라우저. 아이콘 클릭 뒤 화면에 frame B, 탭 수 1, 가로챈 `window.open` 호출 0 |
| 없는 id·`https://` 링크는 새 탭 | 통과 | 같은 화면에서 두 아이콘 클릭 → `window.open(_, "_blank")` 2회(Excalidraw 기본 동작) |
| 기존 `npm test` | 통과 | `npm test` 전체 |

라벨 박스에 `link`만 바꾸는 CLI `update`도 화면까지 갔다: 새로고침 없이 링크 아이콘이 생기고, 동기화 뒤 라벨 텍스트는 하나다.

## 핸드오프 — 판단 끝, 슬라이스 B 구현 착수 (2026-10-08)

### Goal

05의 남은 슬라이스 B(그림 참조 링크와 클릭 이동) → C(글꼴과 크기 기본값)를 구현한다. 결정은 이 문서 본문에 있고, 착수 전 판단 4개는 사용자가 2026-10-08에 끝냈다(Comments). 새 규칙을 만들지 않는다 — 어긋나면 멈추고 사용자에게 묻는다(무엇이 어긋나는지, 선택지).

### First Action

사용자에게 "슬라이스 B 구현을 시작한다"고 한 줄로 말하고 시작한다. 묻지 않는다 — 사용자가 2026-10-08에 "A 마무리됐고 B 구현하면 되는 상태"를 확인했다.

B의 빨간 테스트는 이미 있다. `scripts/check-frames.mjs`의 `mcpBatchKeepsFrameFields` 끝에 `link` 케이스 3개(`create_element`로 `link: "?element=mf"` 유지 / `update_element`로 `link: null` / `batch_create_elements`로 유지)가 들어 있고, 현재 `dist`에서 실패한다(`"link": "?element=mf"`가 안 나옴 — MCP 스키마가 `link`를 버린다). 고칠 곳:

1. `src/core/mcp-dispatch.ts`의 zod `ElementSchema`에 `link: z.string().nullable().optional()` — `frameId`·`name` 옆.
2. `src/core/mcp-tools.ts`의 JSON 스키마 세 곳(`create_element`, `update_element`, `batch_create_elements`의 items)에 `link: { type: ['string', 'null'], description: ... }`. 설명은 칸이 무엇인지만("`?element=<frame id>`는 다른 그림을 가리킨다"). 언제 쓰는지는 03의 규칙이라 적지 않는다. 설명 문자열은 작은따옴표라 `'`를 넣으면 빌드가 깨진다.
3. `frontend/src/App.tsx`의 `onLinkOpen` — `PROTOTYPE` 주석만 보통 주석으로 바꾼다. 로직은 본문 규칙 그대로라 손대지 않는다.

그 뒤 `npm run test:frames`(빌드 포함)로 초록 확인 → 브라우저 인수(아래 Context) → B 인수 4개 체크·결과 표 → 커밋.

### Context

- 이 세션은 `/grill-with-docs`로 판단 4개를 하나씩 물어 끝냈다. 결과는 Comments 2026-10-08 줄과 "Decisions Made". ADR-0008은 코드 사실 문장을 지우고 `onLinkOpen` 부분을 한 줄로 줄였다(ADR 기준: 되돌리기 어려움·놀라움·트레이드오프 — 코드 사실은 ADR이 아니다).
- 브라우저 인수는 세 가지를 본다: (1) 링크 박스를 선택하면 나오는 링크 아이콘을 눌러 같은 탭에서 대상 frame으로 이동, 탭 수 전후 같음(`tabs_context_mcp`). (2) 없는 id를 가리키는 `?element=` 링크는 새 탭(기본 동작). (3) `https://` 링크도 새 탭. 라벨 있는 박스에 `link`만 바꾸는 `update_element`가 화면까지 가는지도 본다 — A에서 PUT 경로가 `label`을 안 바꾼 수정은 `withoutLabel`로 보내게 바뀌었다(`src/server.ts`).
- **이 세션의 MCP 툴(`mcp__plugin_excalidraw-architect_archdraw__*`)로 확인하지 않는다.** npm 게시본이라 옛 스키마가 `link`를 버려 고친 코드가 안 보인다. 확인은 `check-frames`의 MCP stdio 케이스와, `npm run build` 뒤 `node dist/bin.js session start --project .`로 띄운 서버에 CLI·REST로 한다.
- 슬라이스 C 주의: A에서 바뀐 PUT 경로(`src/server.ts`의 `touches(['label'])` 부분)와 프론트 `reconcileAgentLabels`(`frontend/src/utils/scene.ts`)가 `label`의 키를 라벨 텍스트와 비교한다. C의 "글자만 바꿔도 글꼴·크기 유지" 규칙은 이 두 곳을 같이 봐야 한다.

### Current Progress (git 기준, 2026-10-08)

- 브랜치 `main`. 마지막 커밋 `57453b1`(옛 핸드오프). 슬라이스 A 코드는 `18dcdbf`. push 안 함.
- 미커밋 3개(`git diff --stat`): 이 문서(판단 기록·핸드오프 교체), `docs/adr/0008-frame-is-the-drawing-unit.md`(1문장 삭제·1문장 축약), `scripts/check-frames.mjs`(B의 `link` 테스트 13줄 추가, 현재 빨강). B 커밋에 같이 넣는다.
- 슬라이스 B 코드: 시작 안 함. C: 시작 안 함.
- `dist/`는 `18dcdbf` 코드의 빌드다(`57453b1`은 문서만).

### Decisions Made

- 2026-10-08 사용자 확정 4개: ADR-0008 코드 사실 문장 삭제 / MCP 실제 호스트 확인은 02 도그푸딩으로 / 서버 frame 이동과 브라우저 드래그 모양 비교는 안 함 / 아래 A의 결정 7개 그대로.
- A의 결정 7개(에이전트가 정하고 사용자가 뒤에 확인): 라벨 `frameId`는 프론트 `syncToBackend`에서 채움 / 빈 frame 거부를 PUT에도 / 자동 확장은 이번에 바뀐 자식만 본다 / 텍스트 글자 변경 시 옛 측정 크기를 버리고 추정 / frame 삭제 알림 순서 라벨 → 박스 → frame / frame 생성 시 `name` 기본 `null` / 400 거부는 MCP 에러로 그대로 전달.

### What Worked

- 판단은 **한 번에 하나씩**, 표 하나와 추천 하나. 사용자가 "하나씩"을 명시했다. 4개가 네 턴에 끝났다.
- "이게 ADR 기준에 맞아?"에 기준 셋을 표로 대조하니 바로 결정됐다.
- A에서: 버그는 `/mattpocock-skills:diagnosing-bugs`로 frame 없는 박스에서 재현해 업스트림 결함인지 가렸다. 서버 규칙 테스트는 `scripts/check-frames.mjs`(실제 `dist/server.js` + MCP stdio), 브라우저 회귀는 `tests/browser/scene-reload.spec.mjs`(`npm run test:canvas`).

### What Didn't Work

- ⚠️ **질문이 끝났다고 구현을 시작하지 않는다.** 이 세션은 판단 4개가 끝나자 묻지 않고 B 테스트를 쓰기 시작했고 사용자가 멈췄다("누가 슬라이스 b 시작하래?"). 그릴의 끝은 "공통 이해 확인"이지 착수가 아니다. 다음 단계로 넘어갈 때는 한 줄로 묻는다.
- ⚠️ 사용자는 긴 보고를 거부한다. 한국어, 결과부터, 표 하나. "일부" 같은 말은 무엇을 확인했고 무엇을 못 했는지로 바로 풀어 쓴다.
- ⚠️ claude-in-chrome에서 페이지를 새로 연 직후 "Sync to Backend" 클릭이 동기화를 안 일으킬 때가 있다. `javascript_tool`로 버튼 `click()`을 부르고 콘솔 "Syncing N elements"로 확인한다.
- ⚠️ excalidraw.com에 파일을 끌어 놓으면 그 탭의 내용이 바뀐다. 확인 뒤 바로 `cmd+z`.
- `mcp-tools.ts` 설명 문자열에 `'`를 넣으면 빌드가 깨진다. CLI `describe`는 `--session`만 받는다.

### Infrastructure State

- 캔버스 세션 `14abd4`(http://127.0.0.1:54064)와 `fde6fc`가 2026-10-08 세션 시작 시점에 떠 있었다(`node dist/bin.js session list`). 30분 유휴면 스스로 끝난다. `fde6fc`에는 A의 시험 데이터가 남아 있다 — B 확인은 `npm run build` 뒤 새 세션을 띄운다.

### Next Steps

1. 슬라이스 B 구현(First Action) → 인수 4개 확인 → 결과 표 → 커밋(영어 1~2문장, 트레일러 없음, push 안 함).
2. 슬라이스 C 구현 → 인수 확인 → 커밋.
3. 05를 닫을 때 `spec.md` 진행 순서 7번과 05 행, 이 문서 맨 위 `Status:`를 고친다. 다음은 03 슬라이스 B.
