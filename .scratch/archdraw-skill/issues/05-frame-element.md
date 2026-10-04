# 05: frame 요소 지원 — 그림 하나 = frame 하나

> 기술 검증 완료(2026-09-20, 코드 확인): 프론트 `scene.ts`는 이미 frame을 스켈레톤 변환에서 제외하고 `restoreElements`에 그대로 넘긴다. frame은 프론트 수정 없이 그려지며, 막는 곳은 서버 타입 목록 `ExcalidrawElementType`(frame 없음) 하나다. frame 자체에는 프론트 수정이 필요 없다. 이 이슈의 프론트 수정은 아래 글꼴 항목에 있다(라벨 글꼴 결함, 글꼴 연결, 새 글씨의 기본값 — 2026-10-04).

**What to build:** 에이전트가 그림을 그릴 때 요소들을 frame 하나로 감싸고 frame 이름을 그림 제목으로 쓴다. 사용자가 브라우저에서 액자를 끌면 그림이 통째로 움직인다. "안 그림" 줄은 frame 안 맨 아래에 놓인다. 과밀 세기와 "한 그림에 한 종류" 판정은 frame 단위로 한다.

- 요소 타입 목록에 `frame` 추가 + 기본값. 현재는 `frameId` 칸만 있고 frame 자체는 없다.
- CLI `add`·`apply`, MCP create/batch로 frame을 만들고 자식 요소를 넣을 수 있다.
- `describe`가 frame과 그 자식을 그림 단위로 묶어 보여준다.
- group + 제목 텍스트 대안은 기각됐다(스펙 §7-6, [ADR-0008](../../../docs/adr/0008-frame-is-the-drawing-unit.md)).
- frame 자동 확장(2026-09-20 그릴 Q4 (a), drawio-mcp `shared/normalize-model.js` 관행): 서버가 frame을 만들거나 frame에 자식을 넣을 때 자식이 frame 경계 밖으로 나가면 frame을 자식이 들어오도록 키운다. 줄이지 않고 자식은 옮기지 않는다(사용자가 옮긴 배치 유지, 일부러 둔 여백 유지). 멱등 — 이미 들어 있으면 아무것도 안 바뀐다. 이유: Excalidraw frame은 밖으로 나간 자식을 잘라 그리므로 스크린샷에서 안 보여 에이전트가 못 잡는다. 서버 생성·수정 경로에만 적용하고 브라우저에서 사용자가 자식을 밖으로 끄는 것은 건드리지 않는다.
- `link` 칸 개방(2026-09-20 그릴 Q1 (a), [ADR-0008](../../../docs/adr/0008-frame-is-the-drawing-unit.md)): 그림 참조는 박스 요소의 `link`에 `?element=<대상 frame id>`로 적는다. 업스트림은 타입에 `link`가 있고 `expand-elements.ts`가 통과시키지만, MCP 툴 JSON 스키마와 `mcp-dispatch.ts`의 zod `ElementSchema`가 `link`를 받지 않아 버린다. `create_element`·`batch_create_elements`·`update_element` 입력에 `link`(string|null)를 연다. 참조를 쓰는 쪽은 03, 저장·재로드 보존은 06.
- 글꼴 기본값(스펙 §7-9, 2026-10-04 그릴로 다시 정함 — 구 "Helvetica(2), 고정폭 안 씀"은 폐기. Excalidraw 화면이 Helvetica에 "old" 표시를 붙인다). 조건은 "한글과 영어 둘 다 읽기 좋은 글꼴"이다. 순서대로 한다:
  1. **결함을 먼저 고친다.** 박스 라벨과 화살표 라벨에 지정한 `fontFamily`가 화면에 적용되지 않는다(독립 텍스트에만 적용된다). 서버 응답에는 값이 있어 원인은 화면 쪽 변환으로 보인다(`frontend/src/utils/scene.ts`의 `convertToExcalidrawElements` 호출 근처). 원인 줄은 확정하지 않았다 — 먼저 재현하고 원인을 찾는다.
  2. **Pretendard를 연결하는 시험을 한다.** 캔버스와 PNG/SVG 내보내기에서 보이는지, 다른 곳에서 연 파일에 글꼴이 남는지 확인한다. 연결 방법 후보 2개(패키지를 고친다 / 화면에서 기존 글꼴의 이름에 다른 글꼴 파일을 연결한다)는 시험 전이다. Excalidraw 0.18.1의 글꼴 목록은 패키지 안에 고정이고 등록 함수는 비공개다. 실패하면 Excalidraw 목록 안의 Nunito를 기본값으로 쓴다.
  3. **코드와 계약 메모지는 고정폭 글꼴**이다(Comic Shanns 또는 Cascadia, 구현할 때 정한다).
  4. 서버가 만드는 텍스트·라벨의 기본값(`src/core/expand-elements.ts`의 텍스트·라벨 생성부 두 곳)과 브라우저에서 사용자가 새로 쓰는 글씨의 기본값(초기 appState `currentItemFontFamily`)을 2번에서 정한 글꼴로 맞춘다. 프론트는 지금 초기 appState에 `theme`만 넘겨 손글씨(Excalifont)가 기본이다(2026-09-20 코드 확인).
  이 이슈에 둔 이유: frame과 같은 요소 기본값 층이고 프론트를 같이 보는 이슈라서.

**Blocked by:** 01 (플러그인 골격)

**Status:** ready-for-agent

- [ ] CLI로 frame 하나와 자식 박스 둘을 만들면 브라우저에 이름 붙은 액자 안에 박스가 보인다
- [ ] 브라우저에서 액자를 끌면 자식이 같이 움직이고, `describe` 좌표가 그걸 반영한다
- [ ] `describe` 출력에서 어떤 요소가 어느 그림(frame)에 속하는지 읽힌다
- [ ] export한 `.excalidraw`를 excalidraw.com에서 열면 frame이 유지된다
- [ ] frame 경계 밖 좌표로 자식을 넣으면 frame이 자식을 포함하도록 커지고, 자식 좌표는 그대로다. 이미 안에 있는 자식을 다시 넣으면 frame 크기가 안 바뀐다
- [ ] 박스 라벨과 화살표 라벨에 `fontFamily`를 지정하면 화면의 실제 요소 데이터에 그 값이 있고 스크린샷에서 그 글꼴로 보인다(결함 수정)
- [ ] Pretendard 시험의 결과를 기록했다: 캔버스, PNG/SVG 내보내기, 다른 곳에서 연 파일. 실패하면 Nunito로 정하고 이유를 적었다
- [ ] `fontFamily` 없이 만든 텍스트·박스 라벨·화살표 라벨의 실제 요소 데이터가 정한 기본 글꼴이고, 브라우저에서 새로 친 글씨도 같다. 한글 + 영어 라벨이 스크린샷에서 읽힌다
- [ ] 코드와 계약 메모지의 글자는 고정폭 글꼴이다. 고른 글꼴(Comic Shanns 또는 Cascadia)을 적었다
- [ ] frame B 안에 박스가 있을 때 `create_element`로 `link: "?element=<B의 id>"`를 준 박스를 만들면 요소 데이터에 그 `link`가 남고, 브라우저에서 박스의 링크 아이콘을 누르면 화면이 B로 이동한다. `update_element`로 `link`를 바꾸거나 `null`로 지울 수 있다
- [ ] 기존 `npm test` 통과


## 검증 방법과 결과 기록 (R10)

구현 담당 에이전트가 CLI·MCP로 만든 frame·자식의 실제 요소 데이터와 `describe`의 소속 요약을 대조한다. frame 표시·제목·자식 포함은 스크린샷으로 확인한다. 액자 드래그와 외부 편집기에서 파일 열기는 실제 브라우저 동작으로 확인하고 전후 데이터·화면 결과를 남긴다. 글꼴 값은 실제 요소 데이터로 검사하고 영어·한글 가독성은 화면에서 확인한다. `describe`가 글꼴 값을 제공한다고 가정하지 않는다.

- [ ] 각 인수 기준의 기대 결과·실제 결과·통과/실패/미시험과 데이터 또는 화면 근거, 기존 테스트 결과를 기록했다.
