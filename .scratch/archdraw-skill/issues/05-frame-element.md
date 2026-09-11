# 05: frame 요소 지원 — 그림 하나 = frame 하나

> 도그푸딩 후 조정. 02에서 캔버스가 frame을 프론트 수정 없이 그린다는 게 확인돼야 착수한다. 안 그려지면 프론트 작업이 추가된다.

**What to build:** 에이전트가 그림을 그릴 때 요소들을 frame 하나로 감싸고 frame 이름을 그림 제목으로 쓴다. 사용자가 브라우저에서 액자를 끌면 그림이 통째로 움직인다. "안 그림" 줄은 frame 안 맨 아래에 놓인다. 과밀 세기와 "한 그림에 한 종류" 판정은 frame 단위로 한다.

- 요소 타입 목록에 `frame` 추가 + 기본값. 현재는 `frameId` 칸만 있고 frame 자체는 없다.
- CLI `add`·`apply`, MCP create/batch로 frame을 만들고 자식 요소를 넣을 수 있다.
- `describe`가 frame과 그 자식을 그림 단위로 묶어 보여준다.
- group + 제목 텍스트 대안은 기각됐다(스펙 §7-6).

**Blocked by:** 01 (플러그인 골격)

**Status:** ready-for-agent

- [ ] CLI로 frame 하나와 자식 박스 둘을 만들면 브라우저에 이름 붙은 액자 안에 박스가 보인다
- [ ] 브라우저에서 액자를 끌면 자식이 같이 움직이고, `describe` 좌표가 그걸 반영한다
- [ ] `describe` 출력에서 어떤 요소가 어느 그림(frame)에 속하는지 읽힌다
- [ ] export한 `.excalidraw`를 excalidraw.com에서 열면 frame이 유지된다
- [ ] 기존 `npm test` 통과
