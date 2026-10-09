# 06: 스냅샷·export 영속화 — 데이터 폴더와 지정 경로

> 02 도그푸딩(구현 뒤)의 판정이 수정 사항으로 돌아온다. 결정: [ADR-0007](../../../docs/adr/0007-canvas-never-cleared-import-copies.md)(얹기·새 ID·restore만 지움) · [ADR-0009](../../../docs/adr/0009-snapshots-per-project-canvas-per-session.md)(프로젝트별 스냅샷·동명 거부) · [ADR-0010](../../../docs/adr/0010-server-reports-save-state-skill-never-asks.md)(저장 상태 동봉).

**What to build:** 사용자가 "지금 상태 찍어둬"라고 하면 스냅샷이 디스크에 남아 서버를 재시작하거나 다음 날 다시 열어도 `restore`된다. 도면으로 승격한 그림을 "저장해"라고 하면 지정 경로에 `.excalidraw`로 export된다. 산출물 저장 경로는 고정하지 않는다. 스토리 17(저장된 도면 복사 → 그 위에 변경 색칠 → before/after 비교)이 세션을 넘겨 동작한다.

- 현재 스냅샷은 메모리 Map이라 서버가 죽으면 사라진다. 저장소를 데이터 폴더 `snapshots/<프로젝트 식별자>/<name>.excalidraw`로 바꾼다.
- **저장소 범위·동명 정책 (검수 R03, 2026-09-14 그릴 확정):** 프로젝트 식별자는 세션의 프로젝트 루트(04) 경로 해시. 같은 프로젝트의 세션들과 다음 날 새 세션이 같은 폴더를 본다 — 캔버스는 세션별, 스냅샷은 프로젝트별. `snapshot list`는 내 프로젝트 것만 보인다. 같은 이름이 이미 있으면 `snapshot save`·`export` 모두 기본 거부하고 있음·만든 시각을 출력한다. `--force`로만 덮어쓴다.
- export는 CLI·MCP 모두 지정 경로를 받는다. 산출물을 `docs/architecture/`나 데이터 폴더로만 제한하는 규칙은 폐기한다(2026-09-16 사용자 결정). MCP의 기존 export 폴더 제한도 이 요구에 맞춘다. 실행 환경의 파일 쓰기 권한과 동명 파일 거부 규칙은 따른다.
- 데이터 폴더는 호스트·채널과 무관하게 `~/.excalidraw-architect/`다([ADR-0013](../../../docs/adr/0013-data-folder-fixed-under-home.md)).
- 산출물 경로·이름: 사용자 지정 값은 그대로 사용한다. 생략된 경로는 03이 프로젝트의 기존 문서 배치를 보고 선택하고, 생략된 파일명은 내용을 보고 영어로 정한다. 06은 전달받은 경로에 export하고 성공한 전체 경로를 반환하며, 03이 이를 사용자에게 알린다. 경로·이름을 재확인하는 단계는 추가하지 않는다. 기존 "줌 경로가 파일명"은 사용하지 않는다.
- 스냅샷 이름: 이름 생략 발화는 03이 캔버스 내용의 영어 이름(확장자 제외)과 생성 시각의 UTC 초 단위를 조합해 `YYYY-MM-DD_HHmmssZ_<영어 이름>`으로 정한다. 06은 전달받은 이름으로 저장하고 성공 시 실제 이름·전체 경로를 반환한다. 직접 지정한 이름은 그대로 사용한다. 같은 초에 같은 이름이면 기존 동명 거부 규칙을 따른다.
- 스냅샷은 디스크에 보관하고 TTL을 두지 않는다. 생성 성공 후 서버 종료·재시작 뒤에도 남고 자동 만료되지 않는다는 안내는 03 담당이다. 업스트림의 메모리 저장소를 교체한다.
- 함께 저장한 그림 사이의 참조를 export·import 및 snapshot save·restore에서 보존한다. import가 ID를 새로 발급할 때 그림 참조도 같은 세트의 새 대상에 맞춰 연결한다. 여러 그림이 공용 내부 그림 하나를 참조하는 관계도 유지한다. 참조 생성·탐색은 03, frame 지원은 05 담당이다.
- **미포함 참조 (2026-09-19 2차 검수 A5):** `--frame`으로 일부만 export하면 파일 밖 대상을 가리키는 참조는 "미포함"으로 남긴다. import 뒤 그 참조는 어떤 기존 그림에도 붙지 않는다 — 이름이 같은 그림이 있어도 연결하지 않는다. 참조는 frame 이름이 아니라 ID 기반이다. 박스 요소의 `link` 칸에 Excalidraw 요소 링크 `?element=<대상 frame id>`를 적는다(2026-09-20 그릴, ADR-0008). `link` 칸을 툴에서 받는 것은 05 담당. import가 ID를 새로 발급할 때 `link`의 frame id도 같은 세트의 새 id로 바꾸고, 세트 밖 id는 미포함으로 둔다. 미포함 `link`는 손대지 않으므로, 같은 캔버스에 같은 id의 원본이 있으면 원본으로 간다 — 그건 평범한 그림 참조다(2026-10-10 그릴 Q1). 대상을 자동으로 함께 저장해 사용자 지정 범위를 넓히지 않는다. 미포함 참조를 따라갈 때의 안내·새로 그리기는 03 담당.
- **저장 상태 기록·동봉 (PRD §3.5 "저장 상태 표시", 2026-09-19):** `export`(전체·`--frame`)·`import`·`snapshot save`가 성공하면 세션 상태에 그림(frame)별 마지막 저장 경로·시각을, 스냅샷은 캔버스 단위 마지막 이름·시각을 적는다. 경로는 `export`·`import`가 돌려준 전체 경로를 적고 디스크를 찾지 않는다(2026-10-10 D4, 구 "명령 인자 그대로"). 경로 없는 저장(`--out` 없는 `export`, JSON 문자열 `import`)은 기록하지 않는다. 파일은 클라이언트가 쓰므로 `export`·`import`는 성공 뒤 서버에 그림 id·전체 경로를 알리고 서버가 기록한다(D2). `screenshot` 결과에 그림별 상태를 동봉한다: 저장 경로와 시각, 저장 이후 그 그림 요소가 바뀌었는지(저장 후 수정됨), 기록된 경로의 파일이 지금 없는지(파일 없음), 기록이 없으면 미저장. 스냅샷은 마지막 이름과 그 후 캔버스 변경 여부. 기록은 세션 메모리에만 두고 스냅샷·export 파일에는 넣지 않는다. 03은 이 값을 옮겨 적기만 한다.
- 미확인 필수요소는 저장을 거부하는 조건이 아니다. "확인 못 함" 표시와 점선을 저장·재로드 후에도 보존한다. 미확인 항목 안내는 03 담당이다.
- **저장 범위·파일 단위 (검수 R07 일부):** PRD §3.5를 따른다. 기본 전체 export는 여러 그림과 현재 배치를 파일 하나에 보존하며, 특정 그림 요청에는 `--frame`을 사용한다. 발화 해석은 03 담당.
- **그림 단위 저장·복사 (검수 R02, 2026-09-14 그릴 확정):** 캔버스에 그림 A·B가 같이 있을 때 A만 저장하고, 저장된 A를 B 옆에 한 장 더 놓을 수 있어야 한다(스토리 17). 규칙 넷:
  1. `export`는 기본 캔버스 전체, `--frame <이름>`이면 그 frame과 `frameId`가 일치하는 자식만 담는다. frame 밖 요소는 빠진다. (frame은 05) 박스에 묶인 라벨 텍스트(`containerId` 있음)는 05가 프론트 동기화 때 컨테이너의 `frameId`를 채우므로 이 규칙만으로 따라온다(2026-10-06 그릴 05 Q6 (b)). 그래도 `containerId`가 있는데 `frameId`가 `null`인 텍스트가 오면 컨테이너를 따른다 — 05 이전에 저장된 데이터 대비.
  2. `import`는 캔버스를 지우지 않고 얹는다. 요소·frame·화살표 바인딩(`startBinding`/`endBinding`/`containerId`/`frameId`, 에이전트 형식 화살표의 `start`/`end`도 같은 규칙) ID를 한 세트로 **항상** 새로 발급한다 — 원본이 캔버스에 있어도 덮어쓰지 않고 독립된 복사본이 된다. `--replace` 옵션은 없앤다.
  3. 캔버스를 지우는 명령은 `snapshot restore` 하나뿐(지우고 전체 복원). "되돌리기는 지운다, 불러오기는 얹는다".
  4. 불러온 그림은 현재 요소 전체 범위의 오른쪽에 간격을 두고, 위 선을 맞춰 놓는다(그림 안 상대 위치 유지). 캔버스가 비어 있으면 파일 좌표 그대로 놓는다. 이름 있는 frame은 `"<원본 이름> (복사)"`. 파일에 frame이 하나도 없으면 **이름이 빈** frame 하나를 씌운다. 이름 없는 frame은 그대로 들여온다. frame 밖 요소는 frame 밖 그대로 들여온다. 서버는 이름을 짓지도, 이름 때문에 거부하지도 않는다 — import 결과에 이름 없는 frame의 id 목록을 돌려주고 03이 내용을 보고 바로 이름을 붙인다(2026-10-09 그릴. 이전 "파일명으로 frame" 규칙은 폐기). 같은 파일을 두 번 불러와 이름이 겹쳐도 그대로 둔다 — `--frame` 호출이 거부하며 두 id를 보여 주면 03이 하나를 고쳐 쓴다.

**Blocked by:** 01 (플러그인 골격), 04 (캔버스 세션의 프로젝트 루트 — 스냅샷 폴더를 나누는 기준), 05 (frame — `export --frame`·import의 frame 씌우기가 frame 요소를 전제)

**Status:** ready-for-agent (2026-10-10 — 6a·6b·6c 커밋됨, 6d1 구현·`npm test` 통과·커밋 대기, 6d2 미착수)

- [x] `snapshot save x` → 서버 `stop` → `start` → `snapshot restore x`로 그림이 돌아온다
- [x] `snapshot list`가 디스크의 스냅샷을 보여준다
- [x] CLI·MCP 모두 실행 환경에서 쓰기가 허용된 사용자 지정 경로에 export한다. `docs/architecture/` 밖이라는 이유로 거부하지 않는다(프로젝트 내 다른 폴더 및 프로젝트 밖 지정 경로 확인)
- [x] export 성공 결과에 실제 저장한 전체 경로가 포함되어 03이 사용자에게 안내할 수 있다
- [x] 데이터 폴더가 없으면 첫 사용 때 만들어진다
- [x] 레포 둘에서 각각 `snapshot save x`하면 서로 다른 폴더에 생기고, 각자의 `snapshot list`엔 자기 것만 보인다
- [x] 같은 레포에서 세션 둘을 열면 한쪽이 찍은 스냅샷이 다른 쪽 `snapshot list`에 보이고 restore된다
- [x] 같은 이름으로 `snapshot save`·`export`하면 거부되며 메시지에 만든 시각이 있고, `--force`면 덮어쓴다
- [x] 이미지 export(MCP `export_to_image`, CLI `screenshot`)도 같은 파일이 있으면 거부하고 `--force`로만 덮어쓴다(2026-10-09 그릴 Q9)
- [x] `export_to_image`·`import_scene`의 경로도 cwd 밖이라는 이유로 거부하지 않는다(2026-10-09 그릴 Q5)
- [x] MCP에 상대 경로를 주면 세션의 프로젝트 루트 기준으로 풀린다. CLI는 cwd 기준. 절대 경로는 그대로(2026-10-09 그릴 Q6)
- [x] 지정 경로의 상위 폴더가 없으면 만들고 저장한다(2026-10-09 그릴 Q8)
- [x] frame A·B가 있는 캔버스에서 `export --frame A`가 A의 요소만 담은 파일을 만들고, B는 파일에 없다
- [x] `--frame`은 frame 이름 또는 id를 받는다. 같은 이름의 frame이 둘이면 거부하고 두 id를 보여 준다(2026-10-09 그릴 Q7)
- [x] `--frame A`로 뺀 파일에서 A 밖 요소에 붙은 화살표 바인딩은 끊겨 있고, 파일이 excalidraw.com에서 열린다. `link`의 미포함 참조는 그대로 남는다
- [x] 그 파일을 `import`하면 B와 원본 A가 그대로 남고, 새 ID를 가진 `A (복사)`가 A·B 오른쪽에 생기며, 복사본 화살표는 복사본 박스에 붙어 있다
- [x] 복사본의 박스 색을 바꿔도 원본 A는 그대로다
- [x] `import --replace`는 사용법 오류로 거부되고, `snapshot restore`만 캔버스를 비운다
- [x] frame 없는 `.excalidraw` 파일을 `import`하면 이름이 빈 frame 하나 안에 들어오고, 결과에 그 frame id가 "이름 없음"으로 나온다. 이름 없는 frame과 이름 있는 frame이 섞인 파일은 이름 있는 것만 `(복사)`가 붙고 거부되지 않는다. frame 밖 요소는 frame 밖으로 들어온다
- [x] 빈 캔버스에 `import`하면 파일 좌표 그대로 놓인다. 같은 파일을 두 번 `import`하면 같은 이름의 frame 둘이 생기고 거부되지 않는다
- [x] frame A·B에서 `export --frame A --out <임의 경로>` 뒤 `screenshot` 결과에 A는 그 경로·시각, B는 미저장으로 나온다. A의 요소를 하나 고친 뒤에는 A가 저장 후 수정됨으로 바뀐다. 파일을 밖에서 지우면 파일 없음으로 바뀐다
- [x] A의 박스를 옮기기만 해도 A는 저장 후 수정됨이 된다(어떤 속성이든 바뀌면 수정, 2026-10-09 그릴 6d Q1)
- [x] frame 밖 요소(그림 사이 화살표·메모)가 있으면 `screenshot` 결과의 그림별 상태에 이름 없는 항목 하나로 묶여 개수와 함께 나오고, 전체 export 뒤에는 그 경로로 저장됨이 된다(6d Q2)
- [x] `export --frame A` 뒤 `snapshot restore`로 A가 바뀌면 `screenshot`에 A가 저장 후 수정됨으로 나온다. restore를 위한 별도 처리 없이 평소 비교로 그렇게 된다(6d Q6)
- [x] `snapshot save` 뒤 `screenshot` 결과에 마지막 스냅샷 이름이 있고, 요소를 고치면 그 후 변경 여부가 참이 된다
- [x] `import <파일>`로 들어온 복사본 frame의 저장 경로가 그 파일로 기록된다
- [x] 저장 상태 기록은 export·snapshot 파일 내용에 들어가지 않는다
- [ ] `session list`·`session_list`의 결과에 캔버스 세션마다 미저장 그림(파일 없음 포함, D3)과 저장 후 수정된 그림의 수가 있다. 붙지 않은 캔버스 세션을 키로 끝내기 전에 에이전트가 이 수를 보고 1회 묻는다(2026-10-05, 04 Q6 · ADR-0010)
- [ ] 사용자가 그림을 지우라고 했을 때 그 그림이 저장됨이 아니면(미저장·저장 후 수정됨·파일 없음, D3) 에이전트가 지우기 전에 1회 묻고, 저장된 그림은 묻지 않고 지운다. `SKILL.md`에 이 규칙이 있다. 서버는 묻지 않고 frame과 자식을 같이 지운다(05) (2026-10-05 05 검수 · ADR-0010)
- [ ] 기존 `npm test` 통과

- [x] frame A·B·C가 있는 캔버스를 기본 export하면 파일 하나에 세 그림과 배치가 모두 남는다. 새 빈 캔버스로 import하면 그림 사이 상대 배치가 유지된다

- [x] A가 B를 내부 그림으로 참조하는 캔버스를 export하고 새 캔버스에 import하면 참조가 새 B를 가리킨다. 두 상위 그림이 B를 함께 참조하는 경우에도 대상은 같은 B 하나다
- [x] 원본 A·B가 있는 캔버스에 같은 파일을 import해도 복사본 A의 참조는 복사본 B를 가리키며 원본 B를 가리키지 않는다
- [x] A가 B를 참조하는 캔버스에서 `export --frame A`한 파일을, 이름이 B인 다른 그림이 있는 새 캔버스에 import하면 복사본 A의 참조는 미포함 상태이고 그 B에 붙지 않는다(2차 검수 A5)
- [x] snapshot save 후 서버를 재시작해 restore하면 그림 사이 참조가 유지된다. 스냅샷에는 시간 경과에 따른 자동 만료가 없다
- [x] 03이 정한 `YYYY-MM-DD_HHmmssZ_<영어 이름>` 스냅샷이 UTC 생성 시각과 일치하는 이름으로 저장되고, 직접 지정한 이름은 그대로 저장된다. 성공 결과에는 실제 이름·전체 경로가 있고 같은 초·이름의 충돌은 거부된다
- [x] "확인 못 함" 필수요소가 있는 그림의 export·import 및 snapshot save·restore가 성공하며 점선과 해당 표시가 유지된다


## 검증 방법과 결과 기록 (R10)

구현 담당 에이전트가 저장·재로드 전후의 실제 요소 데이터, 디스크 파일, CLI·MCP 결과로 위 인수 기준을 확인한다. 각 결과에 초기 조건·기대 결과·실제 결과·통과/실패/미시험과 근거를 남긴다.

- 저장 경로·폴더 생성·목록·프로젝트 및 세션 간 공유·동명 거부·강제 덮어쓰기·이름과 시각·오류 응답은 실제 파일과 반환 결과를 대조한다. 충돌 거부 시 기존 파일이 바뀌지 않았는지도 확인한다.
- 전체/그림별 저장 범위, 원본 보존, 새 ID·바인딩·그림 참조, 복사본 독립성, 상대 배치, frame 이름, 미확인 필수요소의 점선·표시는 전후 요소 데이터와 파일 내용으로 비교한다. ID가 바뀌는 import는 새 ID 간 연결과 상대 좌표로 판정한다.
- 디스크 보관은 서버 종료·재시작 후 목록과 복원 결과로 확인한다. TTL 없음은 저장소 구현에 자동 만료 경로가 없는지도 확인한다.
- 복원·복사 후 frame·화살표·점선·표시는 스크린샷으로 확인해 데이터 검사와 별도 결과로 남긴다. 03과의 저장 후 내부 탐색은 03 구현이 준비된 뒤 공동 확인한다.
- [ ] 위 인수 기준의 데이터 검사 결과와 스크린샷 확인 결과, 기존 테스트 결과가 기록됐다. 미실행 항목을 통과로 표시하지 않았다.

## 슬라이스 6a 결과 (2026-10-09)

나눈 기준: 인수를 저장 대상별로 묶었다. 6a 스냅샷 디스크화 → 6b export(경로·동명 거부·`--frame`) → 6c import(얹기·새 ID·참조 재매핑) → 6d 저장 상태(screenshot·`session list`·SKILL.md).

| 인수 | 결과 | 근거 |
|---|---|---|
| `snapshot save x` → `session end` → 새 `session start` → `restore x` | 통과 | `check-snapshots` 2케이스(에이전트 모양 요소, 브라우저 동기화 뒤 실제 요소). 실세션: 동기화된 10개 저장 → 재시작 → 복원 10개, 저장 파일과 복원 데이터의 id·`containerId`·`frameId`·`link`·바인딩 같음 |
| `snapshot list`가 디스크의 것을 보여 줌 | 통과 | 테스트 + 실세션 재시작 뒤 목록 |
| 데이터 폴더 첫 사용 때 생성 | 통과 | 테스트(폴더를 지운 뒤 저장) |
| 프로젝트 둘은 폴더 둘, 목록은 자기 것만 | 통과 | 테스트 |
| 같은 프로젝트의 세션 둘이 공유·복원 | 통과 | 테스트 |
| 동명 거부·만든 시각·`--force` | 스냅샷만 통과 | CLI·MCP 테스트. 거부 뒤 기존 파일 내용 그대로. 실세션 거부 메시지에 시각·경로. export 쪽은 6b |
| 재시작 뒤 그림 참조 유지, 자동 만료 없음 | 통과 | 테스트(`link: ?element=fb`). 저장소에 지우는 코드 없음 |
| 이름 그대로 저장, 결과에 이름·전체 경로, 같은 이름 충돌 거부 | 통과 | 테스트(`2026-09-16_053012Z_order-flow`). UTC 이름을 짓는 것은 03 |
| "확인 못 함" 점선·표시 유지 | 스냅샷만 통과 | 테스트(`strokeStyle`·`customData`), 복원 스크린샷에 점선. export·import는 6b·6c |
| 복원 스크린샷 | 통과 | 실세션 브라우저·CLI `screenshot`: frame 둘·라벨·점선·바인딩 화살표·링크 아이콘 |
| 깨진 파일 하나가 목록을 막지 않음 | 통과 | 테스트(깨진 JSON 하나 + 정상 하나 → 둘 다 목록, 깨진 쪽만 `error`, restore 실패·캔버스 유지) |
| 기존 `npm test` | 통과 | `npm test` 전체(`test:snapshots` 10개 추가), 타입 검사 둘 |

파일 내용은 업스트림 그대로다: 서버 요소 원본을 `.excalidraw` 껍데기에 담는다(복원이 id까지 정확). export만 완성 형식으로 변환한다.

티켓에 없어 정한 것(2026-10-09 그릴 확정):
- 프로젝트 폴더 이름은 `<프로젝트 폴더명>-<루트 경로 sha256 앞 8자>`. 사람이 `ls`로 어느 프로젝트인지 안다. 해시는 같은 이름 프로젝트 둘을 가른다.
- 동명 거부 메시지의 "만든 시각"은 파일 mtime. `--force` 뒤에는 덮어쓴 시각이다. 6b export도 같다.
- 깨진 스냅샷 파일은 `snapshot list`에 `error`를 붙여 보여 주고 나머지는 정상으로 나온다. restore는 실패하고 캔버스는 그대로다.
- 경로 구분자·`..`가 든 이름은 거부한다(데이터 폴더 밖 쓰기 방지). 동명 확인은 배타적 생성(`wx`)이라 두 세션이 동시에 저장해도 덮어쓰지 않는다.

알려진 한계: 프로젝트 폴더를 옮기거나 이름을 바꾸면 해시가 바뀌어 옛 스냅샷이 목록에 안 나온다. `~/.excalidraw-architect/snapshots/<옛 폴더명-해시>/`의 파일을 새 폴더로 손으로 옮기면 된다. 자동 이어 주기는 06 범위 밖이다.

남은 위험: 스크린샷(`exportToBlob`)에서 화살표 라벨이 선과 겹쳐 그려진다. 스냅샷 없이 새로 그린 캔버스도 같아 6a와 무관하다. 브라우저 화면에서는 정상이다.

## 슬라이스 6b 결과 (2026-10-09)

테스트: `scripts/check-export.mjs` 11케이스(`npm run test:export`, `npm test`에 포함). 실제 `dist`, 샌드박스 HOME, MCP 프로세스 cwd는 프로젝트 밖. 이미지는 같은 프로세스의 WebSocket 가짜 탭이 고정 바이트로 답한다.

| 인수 | 결과 | 근거 |
|---|---|---|
| CLI·MCP가 지정 경로에 export, 프로젝트 안 다른 폴더·프로젝트 밖 모두 | 통과 | CLI: 프로젝트 밖 절대 경로, 프로젝트 `src/notes/`(cwd 기준). MCP: 프로젝트 `design/flows/`, 프로젝트 밖 절대 경로 |
| 성공 결과에 전체 경로 | 통과 | CLI `file`, MCP 결과 문장 |
| export 동명 거부·만든 시각·`--force` | 통과 | CLI·MCP. 거부 뒤 기존 파일 내용 그대로. 시각 = mtime |
| 이미지 동명 거부·`--force` | 통과 | CLI `screenshot`(png), MCP `export_to_image`(svg). 실제 브라우저 렌더링은 미시험(가짜 탭) |
| `export_to_image`·`import_scene` cwd 밖 허용 | 통과 | MCP cwd 밖의 프로젝트 경로·절대 경로 |
| 상대 경로: MCP는 프로젝트 루트, CLI는 cwd, 절대는 그대로 | 통과 | 위 케이스들 |
| 상위 폴더 생성 | 통과 | `.excalidraw`·png·svg |
| `export --frame A`는 A만 | 통과 | A 요소·라벨 있음, B 요소·라벨 없음. frame id로도 됨. MCP `frame`도 같음 |
| 같은 이름 frame 둘 → 거부, 두 id 표시 | 통과 | CLI·MCP. 없는 이름은 캔버스의 frame 목록과 함께 거부 |
| A 밖 바인딩 끊김, `link` 유지 | 통과 | `endBinding: null`, `link: ?element=fb`. 파일 안 모든 id 참조가 파일 안에 있음(`assertSelfContained`) |
| 파일이 excalidraw.com에서 열림 | **미시험** | 위 데이터 검사만. 실제로 열어 보지 않았다 → 체크박스 열어 둠 |
| `frameId` 없는 라벨은 박스를 따름 | 통과 | 동기화 데이터(`containerId`만 있는 텍스트) |
| "확인 못 함" 점선·표시 유지(export) | 통과 | 전체·frame export 모두. import 쪽은 6c → 체크박스 열어 둠 |
| 기존 `npm test` | 통과 | 전체 exit 0, `tsc --noEmit`·`type-check:frontend` 통과 |

바꾼 것: `sanitizeFilePath`(`normalize.ts`)·`ALLOWED_EXPORT_DIR`(`config.ts`) 삭제, AGENTS.md "되살아나면 다시 지울 것"에 추가. 쓰기는 `writeOutputFile`(`scene-io.ts`) 하나로 모았다(`wx` 배타 생성). MCP 상대 경로는 `resolveFromProjectRoot`(`mcp-session.ts`). frame 소속 규칙은 서버의 `frameMembers`(`frames.ts`)를 그대로 쓴다. MCP 툴 스키마에 `export_scene`의 `frame`·`force`, `export_to_image`의 `force` 추가. `canvas-ops.md` 표 갱신.

티켓에 없어 정한 것(2026-10-09 그릴 확정, 커밋 `97f9408`):
- `--frame` 파일의 이미지 `files`는 그 frame 요소가 쓰는 것만 남긴다. 파일 안 id 참조 검사(`assertSelfContained`)가 빠진 `fileId`를 잡는다.
- 박스가 파일 밖인 텍스트의 `containerId`는 `null`로 끊는다(바인딩과 같은 이유).
- `--frame` 값이 어떤 frame의 id와 같으면 이름보다 id를 먼저 고른다. id는 유일하고 이름은 중복될 수 있다.
- "excalidraw.com에서 열림"은 6c 끝 실세션 스크린샷 때 같은 파일로 함께 확인한다. 체크박스는 그때까지 열어 둔다.

커밋 직후 하네스의 자동 보안 검토가 2건을 지적했다: `import_scene`의 임의 파일 읽기, `export_*`의 경로 탈출(모두 `mcp-dispatch.ts`, "통제 후퇴"). 둘 다 아래 "보안 트레이드오프"의 결정이다. 사용자 재확인(2026-10-09): 경로 제한은 되살리지 않고 **파일 종류 제한으로 피해 범위를 줄인다** — 6c에 넣는다("슬라이스 6c 결정" 참조).

알려진 한계:
- 동명 거부로 끝나도 새로 만든 상위 폴더는 남는다.
- frame 사이를 잇는 화살표(`frameId` 없음)는 어느 `--frame` 파일에도 들어가지 않는다. 티켓 규칙 1 그대로다.

보안 트레이드오프(결정대로 둠): MCP 툴이 프로세스 권한 안에서 어느 경로든 읽고 쓴다. 2026-09-16 사용자 결정·Q5. 덮어쓰기는 `force`일 때만이고, 실행 권한은 호스트가 정한다. 근거: MCP 호출자는 호스트 안의 에이전트이고 이미 Bash로 같은 파일 권한을 가지므로 툴만 막아도 실익이 없다. 이 결정은 "해소"가 아니라 "수용"이다 — 에이전트가 사용자 쓰기 권한이 있는 어느 폴더에든 **새** 파일을 만들 수 있다는 점은 남는다. 6c의 확장자 허용 목록이 그 파일을 그림 파일(`.excalidraw`·`.excalidraw.md`·`.png`·`.svg`)로 한정한다.

## 슬라이스 6c 결과 (2026-10-09)

테스트: `scripts/check-export.mjs`에 6케이스 추가(전체 17, `npm test`에 포함). 6b와 같은 방식(실제 `dist`, 샌드박스 HOME, 서버 HTTP로 전후 요소 비교). 인자를 주면 이름에 그 글자가 든 케이스만 돈다.

| 인수 | 결과 | 근거 |
|---|---|---|
| 확장자 허용 목록(쓰기 4종·읽기 3종), `--force`여도 거부, 거부 뒤 파일 없음, `.excalidraw.md` export 유지 | 통과 | CLI `export .txt`, MCP `export_to_image .bmp`, CLI·MCP `import .txt` |
| `--frame A` 파일: 바인딩 끊김, `link` 유지, excalidraw.com에서 열림 | 통과 | 데이터는 6b 테스트. 실세션: 같은 파일을 excalidraw.com에 끌어 놓아 frame·라벨·점선·링크 아이콘·끊긴 화살표가 보임 |
| import: 원본 A·B 그대로, 새 ID의 `Order flow (복사)`가 오른쪽 80 간격, 복사본 화살표는 복사본 박스에 | 통과 | 원본 요소 전후 `deepEqual`, frame x = 1200 + 80 |
| 복사본 색 변경이 원본에 안 번짐 | 통과 | `update` 뒤 원본 `a1` 그대로 |
| `import --replace` 사용법 오류, 캔버스 안 지움 | 통과 | exit 2, 요소 수 그대로. MCP `mode`도 오류 |
| frame 없는 파일 → 이름 빈 frame 하나, 결과에 id. 섞인 파일은 이름 있는 것만 `(복사)`. frame 밖 요소는 밖 | 통과 | CLI `unnamedFrames`, MCP "Unnamed frames" 문장 |
| 빈 캔버스는 파일 좌표, 두 번 import해도 거부 없음 | 통과 | 두 번째 복사본은 첫 복사본 오른쪽 80 |
| 전체 export → 새 캔버스 import: 세 그림·배치 유지, A·C의 참조가 같은 새 B | 통과 | frame 사이 상대 좌표 같음. 재매핑을 끄면 실패함을 확인 |
| 원본 옆 import: 복사본 A는 복사본 B를 가리킴 | 통과 | 원본 `ra1`의 링크는 원본 `rb` 그대로 |
| `--frame A` 파일 → 이름이 B인 다른 그림이 있는 새 캔버스: 참조가 그 B에 안 붙음 | 통과 | 링크 `?element=rb` 그대로 |
| "확인 못 함" 점선·표시(import) | 통과 | 복사본의 `strokeStyle`·`customData` |
| 복사 후 스크린샷 | 통과 | 실세션 CLI `screenshot`: 원본 둘 + 오른쪽 `Order flow (복사)`, 라벨·점선·바인딩 화살표 |
| 기존 `npm test`, 타입 검사 둘 | 통과 | exit 0 |
| 결정 5: `roundness` 없는 박스 → 파일 `null`·복사본 각짐, 명시값 유지 (2026-10-10) | 통과 | `cornersAreSavedAsTheCanvasDrawsThem`. 수정 전 빨강(파일에 `{type: 3}`) 확인. 수정 뒤 `npm test` 전체 exit 0(export 18케이스), 타입 검사 둘 통과. `share-url.ts`도 같은 변환을 써서 공유 링크도 각진 모서리가 된다 |

바꾼 것: `importScene`(`scene-io.ts`)이 새 ID 세트(요소·`frameId`·`containerId`·바인딩·`start`/`end`·`boundElements`·`groupIds`·`link`의 `?element=`), 복사본 이름, 배치를 맡는다. 세트 밖 구조 참조는 `null`, `link`만 그대로. 복사본의 `index`는 버려 브라우저가 새로 매긴다. CLI `import <파일>`은 파일 경로를 넘겨 허용 목록을 탄다. MCP `import_scene`의 `mode` 삭제, 모르는 인수는 거부. `canvas-ops.md` 표·툴 설명 갱신.

**사용자 판단 결과 (2026-10-10 그릴):**
1. **같은 캔버스에 import하면 미포함 참조가 원본으로 간다 → 그대로 둔다.** `--frame A` 파일의 `link: ?element=fb`는 손대지 않으므로 원본 B(`fb`)가 캔버스에 있으면 복사본 링크가 원본 B로 간다. ID가 실제로 같은 경우라 15행의 취지(이름으로 붙이지 않음)와 충돌하지 않는다. 15행·ADR-0008·CONTEXT.md "미포함 참조"에 반영했다. 기각한 안: 캔버스에 있는 id를 가리키는 미포함 링크를 끊기(복사본에서 내부 그림으로 가는 길이 사라짐).
2. **묻지 않고 정한 것 넷(멈춤 조건 위반) → 넷 다 그대로 둔다.** 아래 "티켓에 없어 정한 것"에 옮겼다.
3. **테스트 이름 필터 인수 → 둔다.**
4. **둥근 모서리 → 06에서 지금 고친다(별도 이슈로 빼지 않음).** 복사본이 원본과 다르게 보이면 스토리 17(나란히 비교)이 깨지므로 06 범위다. "슬라이스 6c 결정" 5번.

티켓에 없어 정한 것(2026-10-10 그릴 확정, 코드는 2026-10-09 구현):
- 복사본 세로 위치는 위쪽 맞춤 — 복사본 맨 위를 기존 요소 범위의 맨 위에 맞춘다. 규칙 4·ADR-0007에 반영.
- 복사본의 `index`(쌓는 순서 값)는 비워 보낸다. Excalidraw의 `restoreElements`(업스트림 프론트가 이미 호출)가 배열 순서대로 새로 매긴다. 파일 값을 들이면 원본과 같은 값이 둘 생겨 복사본이 원본 사이에 끼어 그려질 수 있다.
- 에이전트 형식 화살표의 `start`/`end`도 `startBinding`/`endBinding`과 같은 규칙으로 새 id로 바꾸고, 대상이 세트 밖이면 칸을 지운다. 안 하면 에이전트가 그린 화살표의 복사본이 원본 박스에 붙는다. 규칙 2에 반영.
- MCP `import_scene`은 `.strict()` — 옛 `mode` 등 모르는 인수가 오면 CLI `--replace`처럼 오류로 거부한다(조용히 무시하면 에이전트가 "지워질 줄 알았는데 얹혔다"를 나중에 안다). 이 레포에서 유일한 `.strict()`.
- `check-export.mjs`는 인수로 이름 필터를 받는다(`node scripts/check-export.mjs <글자>`). `npm test`는 인수 없이 전부 돈다.

## 슬라이스 6c 결정 (1~4는 2026-10-09 그릴 확정·구현됨, 5는 2026-10-10 확정·구현됨)

범위는 티켓 "그림 단위 저장·복사" 규칙 2·4, 그림 참조·미포함 참조 단락, 관련 체크박스. 결정은 ADR-0007·0008. 티켓에 없어 정한 것:

1. **배치 간격 80.** 불러온 그림은 현재 요소 전체 범위의 오른쪽에 frame 여백(`FRAME_MARGIN = 40`)의 두 배 간격으로 놓는다. 새 숫자를 두지 않고 기존 상수에서 파생한다. 두 frame이 각자 여백만큼 떨어져 나란히 비교할 수 있다. 캔버스가 비어 있으면 기준이 없으니 파일 좌표 그대로 놓는다(Q4) — 전체 export → 새 캔버스 import의 배치가 파일과 같아진다.
2. **확장자 허용 목록.** 쓰기(`export`·이미지 export)는 `.excalidraw`·`.excalidraw.md`·`.png`·`.svg`로 끝나는 경로만 받는다(`.excalidraw.md`는 기존 Obsidian 경로 지원 유지). `--force`가 있어도 다른 확장자는 거부한다. 읽기(`import`)는 `.excalidraw`·`.excalidraw.md`·`.json`만 받는다. 거부 메시지에 허용 확장자를 적는다. 경로는 계속 어디든 된다 — 제한은 경로가 아니라 파일 종류다. 비용 없음: 사용자 스토리는 이 종류만 쓴다. MCP `import_scene`의 `data`(JSON 문자열)는 파일을 읽지 않으니 이 검사와 무관하고 그대로 둔다.
   - [x] `export --out ~/x.txt`·`export_to_image`의 `.bmp` 등은 `--force`가 있어도 거부되고 메시지에 허용 확장자가 있다. `import`에 `.txt`를 주면 거부된다. `.excalidraw.md`로 export는 계속 된다
   - [x] 거부로 끝났을 때 파일이 생기지 않았다
3. **이름은 서버가 짓지 않고, 이름 때문에 거부하지 않는다(Q3·Q5).** 규칙 4에 반영했다. 경우별:

   | 파일·`data` 안 | 처리 | import 결과에 |
   |---|---|---|
   | frame 0개 | 이름 빈 frame 하나를 만들어 전부 넣는다 | 이름 없는 frame id 1개 |
   | frame 1개 이상, 전부 이름 있음 | 각각 `<원본> (복사)` | — |
   | 이름 없는 frame이 섞임 | 이름 있는 것만 `(복사)`, 없는 것은 빈 채로 | 이름 없는 frame id 목록 |
   | frame 밖 요소도 있음 | frame 밖 그대로(새 frame에 넣지 않음 — 전체 export의 그림 사이 화살표) | — |

   이름 없는 frame은 캔버스에 Excalidraw 기본 표시(`Frame 1`)로 보이는 몇 초 뒤 03이 이름을 붙인다. 중복 이름도 서버가 번호를 붙이지 않는다. `--name` 같은 새 옵션은 두지 않는다 — 이름 변경(`update_element`의 `name`)이 이미 있다. 서버는 이름 없는 frame을 이미 허용한다(`describe`가 `Frame ""`로 보여 줌).
4. **`link`는 손대지 않는다.** 불러온 파일은 신뢰하지 않는 입력이지만 ID 전체 재발급(규칙 2)이 기존 요소 덮어쓰기를 막고, 요소는 기존 서버 스키마로 검증한 것만 넣는다. `link`의 `javascript:` 같은 값은 브라우저의 Excalidraw가 `sanitize-url`로 무해화한다(번들에서 확인, 2026-10-09). 서버가 따로 걸러내지 않는다.
5. **export는 모서리 기본값을 덧붙이지 않는다(2026-10-10 그릴 Q4).** 캔버스는 `roundness`가 없는 박스를 각진 모서리로 그리는데, export는 업스트림 기본값으로 둥근 모서리(`{type: 3}`)를 채워 파일·복사본만 둥글었다. 원본과 복사본이 나란히 놓이면 다르게 보이므로 06 범위다. export는 `roundness`를 있으면 그대로, 없으면 `null`로 둔다. 캔버스에 보이는 것을 그대로 저장한다.
   - [x] `roundness` 없는 박스를 export하면 파일에 `null`이고, import 복사본도 각진 모서리다. `roundness`를 명시한 박스는 파일·복사본에서 그 값을 유지한다

03에 넘길 규칙(6c 범위 밖, 메모): import 결과에 이름 없는 frame이 있으면 내용을 보고 바로 영어 이름을 붙인다. 이름이 겹치면 하나를 고친다.

## 슬라이스 6d 결정 (2026-10-09 그릴 확정, 미착수)

범위는 티켓 "저장 상태 기록·동봉" 단락, `session list` 수, `SKILL.md` 지우기 전 1회 묻기 규칙, 관련 체크박스. 결정은 ADR-0010. 티켓에 없어 정한 것:

1. **"저장 후 수정됨" 판정 = 어떤 속성이든 다르면(Q1).** export 성공 때 그 frame에 속한 요소 전부를 직렬화해 해시를 기록하고, `screenshot` 때 지금 요소의 해시와 비교한다. 같으면 저장됨, 다르면 저장 후 수정됨. 위치 이동만 해도 수정이다 — 파일과 다르다는 사실을 그대로 알린다. 서버는 변화를 감시하지 않고 `screenshot`이 불릴 때 한 번 비교한다. 서버가 바꾼 것만 세는 안은 브라우저에서 손으로 고친 것을 놓쳐 탈락.
2. **frame 밖 요소는 이름 없는 항목 하나로 묶어 그림별 상태에 넣는다(Q2).** 개수와 상태를 함께 적는다. 전체 export가 성공하면 그 경로로 저장됨이 된다. 빼 버리면 세션을 끝낼 때 그림 사이 화살표·메모가 경고 없이 사라진다.
3. **`snapshot restore`에 특별 처리 없음(Q6).** restore도 요소를 바꾸는 일이라 1번 비교가 그대로 맞는 답을 낸다. 기록을 지우거나 옮기지 않는다. 사라진 frame의 기록은 비교 대상이 없으니 결과에 나오지 않는다.

`screenshot` 결과 모양(지금은 `success`·`file`·`format`만): 그림별 배열을 한 칸 더한다. 항목마다 frame 이름·id, 상태 넷 중 하나(저장됨·저장 후 수정됨·미저장·파일 없음), 기록이 있으면 경로·시각. frame 밖 묶음은 이름이 비고 개수가 있다. 스냅샷은 캔버스 단위로 마지막 이름·시각·그 뒤 변경 여부.

## 슬라이스 6d 착수 전 결정 D1~D6 (2026-10-10 그릴 확정)

코드를 읽다가 찾은 사실과 티켓에 없던 인터페이스 결정. ADR-0010 Consequences·CONTEXT.md "저장 상태"·티켓 16·56·57행·spec 206행에 반영됨. 다시 논의하지 않는다.

**D1. 브라우저 동기화만으로 "저장 후 수정됨"이 되는 문제 — 무엇을 비교하나**
- 사실: 사용자가 캔버스를 한 번 누르면(`frontend/src/App.tsx`의 `onPointerDownCapture`·`onKeyDownCapture`가 `userInteractedRef`를 켬) 그 뒤 Excalidraw `onChange`마다 `syncToBackend()`가 **모든 요소**를 서버로 보낸다. 서버 `src/server.ts`의 `POST /api/elements/sync`는 저장소를 비우고 요소마다 `syncedAt`·`syncTimestamp`·`source`·`version: 1`을 새로 붙인다. `onChange`가 스크롤·선택에도 불리는지는 Excalidraw 동작이라 (unverified).
- 예: export 때 `{id:"a1", label:{text:"Order"}}` → 사용자가 한 번 만진 뒤 `{id:"a1", boundElements:[{id:"t9"}], index:"a0", syncedAt:…}` + 라벨 텍스트 `t9`. 내용은 같다. 6d 결정 1("어떤 속성이든 다르면")을 글자 그대로 쓰면 "저장 후 수정됨"이 된다. 에이전트 형식(`label`)이 브라우저 형식으로 바뀌는 세부는 6a 실세션 기록(86행)에서 본 기억이라 (unverified).
- 선택지: (a) 기록용 칸(`syncedAt`·`syncTimestamp`·`source`·`version`·`createdAt`·`updatedAt`·`versionNonce`·`updated`)만 빼고 나머지 전부 비교. 에이전트가 그렸거나 import한 그림은 첫 동기화 뒤 거짓 "수정됨"이 1회 날 수 있으나 수정을 놓치지는 않는다. (b) 보이는 칸만 골라 비교. 거짓 "수정됨"이 줄지만 다 없어지진 않고, 목록에서 빠진 칸의 수정을 놓친다.
- 추천: (a). 거짓 "수정됨"의 비용은 질문 1번, 놓침의 비용은 그림 유실.
- **결정(2026-10-10 그릴): (a).** 서버가 자동으로 찍는 기록 칸 8개(`syncedAt`·`syncTimestamp`·`source`·`version`·`createdAt`·`updatedAt`·`versionNonce`·`updated`)만 빼고 나머지 전부 비교한다. 코드 확인: 클릭 한 번 뒤 `onChange`마다 디바운스된 전체 동기화가 가고(`frontend/src/App.tsx` `scheduleAutoSync`), 서버는 저장소를 비우고 요소마다 기록 칸을 새로 붙인다(`src/server.ts` `POST /api/elements/sync`).

**D2. 저장 기록을 어디에 두고 어떻게 적나**
- 사실: export·import는 CLI·MCP 프로세스에서 돈다(`src/core/scene-io.ts`의 `buildSceneFile()`·`importScene()`이 HTTP로 요소를 읽고 파일을 직접 쓴다). CLI는 호출마다 끝난다. `snapshot save`는 캔버스 서버 안에서 돈다(`POST /api/snapshots`). `session list`는 `src/core/sessions.ts`의 `probeSession()`이 각 서버의 `/health`를 읽는다.
- 추천: 캔버스 서버 메모리에 둔다. 새 HTTP 경로 둘 — `POST /api/save-state`(export·import가 파일을 쓴 뒤 경로·frame id를 보내고 서버가 그 순간 자기 요소로 해시 계산), `GET /api/save-state`(`screenshot`이 그림별 상태를 받음). `snapshot save`는 서버 안에서 바로 기록. `/health`에 미저장 수·수정됨 수를 넣어 `session list`가 그대로 보여 준다. 기각 후보: export·import를 서버로 옮기기(6b·6c 경로 해석을 다시 짜야 함).
- **결정(2026-10-10 그릴): 캔버스 서버 메모리 + `POST /api/save-state`·`GET /api/save-state`.** 근거: 파일 쓰기가 클라이언트(MCP 프로세스·CLI 일회성 프로세스)에 있는 구조는 업스트림 그대로이고 6b·6c가 이미 그 위에 커밋됐다. 서버로 옮기면(기각안) export·import 전체와 테스트 17케이스를 이사해야 하고, 서버 cwd가 CLI·MCP 어느 쪽도 아니라 결국 클라이언트가 절대경로를 알려 주는 모양이 된다. MCP 프로세스 메모리에 두는 안도 기각: 다른 대화의 MCP 프로세스·재attach한 새 프로세스가 못 보고, `snapshot save`는 서버에서 처리돼 기록이 갈라진다. 남는 위험: export 성공 뒤 알려 주기 호출을 빼먹으면 기록이 없다 — `writeOutputFile` 직후 한 곳이라 테스트 한 케이스로 잡는다.

**D3. "파일 없음"을 미저장으로 세나**
- 파일이 밖에서 지워졌고 그림도 바뀐 경우 어느 상태를 보이나, 그리고 `session list` 수·지우기 전 묻기(56·57행)에 넣나. 티켓 글자는 "미저장·저장 후 수정됨"만 센다 — 그대로면 파일이 지워진 그림은 묻지 않고 사라진다.
- 추천: "파일 없음"을 먼저 보이고, 수와 묻기에서는 미저장으로 센다.
- **결정(2026-10-10 그릴): 묻는다.** `screenshot`에는 `missing`으로 따로 표시하고, `session list`의 미저장 수에는 `missing`을 포함하며, `SKILL.md`의 지우기 전·세션 끝내기 전 규칙은 "`saved`가 아니면 1회 묻는다"로 적는다. 파일 삭제가 실수일 수 있고 묻는 비용은 질문 한 번이다. 56·57행·ADR-0010의 "미저장·저장 후 수정됨"은 "저장됨이 아니면"으로 고친다.

**D4. 기록하는 경로 = 인자 그대로 vs 전체 경로**
- 16행은 "명령 인자로 받은 값을 그대로" 적으라 한다. 그런데 캔버스 서버의 cwd는 CLI와 달라 `./a.excalidraw`로는 "파일 없음"을 확인할 수 없다.
- 추천: export가 결과로 돌려주는 전체 경로(CLI는 cwd, MCP는 프로젝트 루트 기준으로 푼 값)를 적는다. 디스크를 찾지는 않는다. 정해지면 16행 문구를 고친다.
- **결정(2026-10-10 그릴): 절대경로.** export·import가 결과로 돌려주는 전체 경로를 적는다. 서버 cwd는 CLI·MCP 어느 쪽도 아니라 상대경로로는 "파일 없음"을 확인할 수 없다. 16행 "명령 인자로 받은 값을 그대로"는 "export 결과의 전체 경로"로 고친다(디스크 스캔 안 함은 유지).

**D5. 결과 모양과 상태 값 글자**
- 추천: 상태 값은 영어 `saved`·`modified`·`unsaved`·`missing`. CLI `screenshot` JSON에 `drawings`(frame마다 `id`·`name`·`state`·있으면 `path`·`savedAt`, frame 밖 묶음은 `id`·`name`이 `null`이고 `elements` 개수)와 `snapshot`(`name`·`savedAt`·`changedSince`)을 더한다. MCP `get_canvas_screenshot`에는 같은 JSON을 텍스트로 붙인다.
- **결정(2026-10-10 그릴): 추천대로.** `state`는 `saved`·`modified`·`unsaved`·`missing`. `drawings` 항목: `id`·`name`·`state`, 기록 있으면 `path`·`savedAt`, frame 밖 묶음은 `id`·`name`이 `null`이고 `elements` 개수. `snapshot`: `name`·`savedAt`·`changedSince`, 없으면 `null`. MCP는 이미지 블록 뒤 텍스트 블록에 같은 JSON 문자열 — 업스트림 툴 20개와 같은 방식. `structuredContent`+`outputSchema`(MCP 스펙 정식 칸, SDK 2.0.0 지원)는 이 툴만 혼자 다른 모양이 되므로 안 쓴다. 20개를 한꺼번에 옮길 때 재고.

**D6. 테스트 경계**
- 추천: `scripts/check-export.mjs`에 케이스를 더한다(6b·6c와 같은 방식: 실제 `dist`, 샌드박스 HOME, 가짜 탭). 브라우저 동기화는 `POST /api/elements/sync`로 흉내 낸다. 판정은 CLI `screenshot`·MCP `get_canvas_screenshot` 결과. 다른 안: 새 파일 `scripts/check-save-state.mjs`(+ `npm test`에 `test:save-state`).
- **결정(2026-10-10 그릴): `check-export.mjs`에 더한다.** 행동만 검사한다 — 구현을 고장 내면 반드시 빨강이 나는 11케이스, 판정은 전부 CLI `screenshot`·`session list`·MCP `get_canvas_screenshot` 결과:
  1. A·B → `export --frame A` → A `saved`+절대경로+시각, B `unsaved`
  2. 1 뒤 A 요소 `update` → A `modified`
  3. 1 뒤 파일 삭제 → A `missing`
  4. 1 뒤 `POST /api/elements/sync`로 같은 요소 재전송(클릭만 한 상황) → A 여전히 `saved` (D1)
  5. 1 뒤 `snapshot restore`로 A가 바뀜 → A `modified` (6d 결정 3)
  6. frame 밖 화살표 1개 → `id: null, elements: 1, unsaved`; 전체 export 뒤 `saved` (6d 결정 2)
  7. `snapshot save x` → `snapshot.name = x`, `changedSince: false`; 요소 고침 → `true`
  8. `import f` → 복사본 frame `saved`, `path` = f 절대경로
  9. export 파일·스냅샷 파일에 `savedAt`·`state` 문자열 없음
  10. A `unsaved`·B `modified`·C `saved` → `session list` `unsaved: 1, modified: 1`; A 파일 삭제 → `unsaved: 2` (D3)
  11. MCP `get_canvas_screenshot` 텍스트 블록 = 1과 같은 JSON
  안 하는 것: 해시 함수 단위 테스트, `/api/save-state` 단독 호출, "필드가 존재한다"류.

**문서로 이미 정해진 것(묻지 않음):**
- MCP `get_canvas_screenshot`에도 상태를 넣는다 — spec 245행, `SKILL.md` "## 10. Saving"이 이 툴 결과에서 옮겨 적게 한다.
- import는 복사본 frame만 기록한다(54행). frame 밖 묶음은 전체 export 때만 기록한다(6d 결정 2).
- `--out`·`filePath` 없는 export와 `data` import는 경로가 없으니 기록하지 않는다(2026-10-10 사용자 확인).

## 슬라이스 6d 계획 (2026-10-10 확정)

6a 스냅샷 디스크화(`5f83f74`) → 6b export(`97f9408`) → 6c import(`cd6cfd6`) → **6d1 → 6d2 → 마무리**. 나눈 기준은 "상태를 만든다 / 쓴다". 슬라이스마다 `/tdd` → `npm test` 전체 → 체크박스 → 끝 보고 → 사용자 확인 → 커밋. 커밋과 다음 슬라이스 착수는 사용자 승인 뒤에 한다.

### 6d1 — 상태를 만든다

**What to build:** export·import·snapshot save가 성공하면 캔버스 서버가 그림별 저장 기록을 들고, 그 뒤 찍는 `screenshot`(CLI)·`get_canvas_screenshot`(MCP) 결과에 그림별 `drawings`와 캔버스 단위 `snapshot`이 D5 모양으로 붙는다. 사용자가 브라우저를 클릭만 해도 상태가 바뀌지 않는다.

**Blocked by:** 없음 (6a·6b·6c 커밋됨)

- 체크박스 49~55
- 테스트 D6의 1~9, 11

### 6d2 — 상태를 쓴다

**What to build:** `session list`(CLI)·`session_list`(MCP) 결과에 캔버스 세션마다 미저장(파일 없음 포함)·저장 후 수정된 그림 수가 있다. `SKILL.md`·`references/saving.md`에 "저장됨이 아니면 1회 묻는다" 규칙이 지우기 전·세션 끝내기 전(붙지 않은 세션은 `session list` 수로) 두 곳에 있다.

**Blocked by:** 6d1

- 체크박스 56·57
- 테스트 D6의 10

### 06 마무리

**Blocked by:** 6d2

- 체크박스 58(`npm test`)·78(R10 기록)
- Status 줄 갱신, `spec.md` 310행 진행 줄("6c import·6d 저장 상태 남음"이라 낡음) 갱신

### 작업 메모

- `/tdd` 한 사이클: 케이스 하나 추가 → `node scripts/check-export.mjs <이름 일부>`로 빨강 → 최소 수정 → 초록 → `npm test` 전체. 서버 코드를 바꿨으면 테스트 전에 `npm run build`.
- 진입점: CLI `screenshot`은 `src/cli/commands/scene.ts` → `screenshot()`, MCP는 `src/core/mcp-dispatch.ts`의 `get_canvas_screenshot` case, CLI `session list`는 `src/core/sessions.ts` → `formatSessionList()`, MCP `session_list`는 `src/core/mcp-session.ts` → `sessionList()`. frame 소속은 `src/core/frames.ts`의 `frameMembers()`. `/health`는 `src/server.ts`.
- `SKILL.md` "## 10. Saving"에는 세션 끝 1회 묻기와 저장 상태 한 줄이 이미 있다("unsaved or modified" → "not saved"로 고칠 것). 없는 것: 그림 지우기 전 1회 묻기, 붙지 않은 세션을 끝낼 때 `session list` 수로 묻기.
- ⚠️ 사용자에게 묻는 것은 하나씩, 쉬운 말로, 예시 먼저, 선택지 둘에 추천 하나. 여러 개를 한 번에·코드 용어로·객관식 팝업으로 묻는 것은 거부됐다. 질문형 말("할까?")은 승인이 아니다 — 계획을 보이고 "예"를 받는다.
- ⚠️ macOS `sed`는 `\b`를 모르고 `cat -A`도 없다. `check-export.mjs`에 이름 필터를 주어도 끝 줄은 전체 수를 찍는다 — 필터 결과는 `ok`/`FAIL` 줄로 본다.

## 슬라이스 6d1 결과 (2026-10-10)

테스트: `scripts/check-export.mjs`에 12케이스 추가(전체 30, `npm test`에 포함). 6b·6c와 같은 방식(실제 `dist`, 샌드박스 HOME, 가짜 탭). 판정은 전부 CLI `screenshot` JSON·MCP `get_canvas_screenshot` 마지막 텍스트 블록.

| 인수(D6) | 결과 | 근거 |
|---|---|---|
| 1. `export --frame A` → A `saved`+절대경로+시각, B `unsaved` | 통과 | `frameExportMarksOnlyThatDrawingSaved`. 빨강 먼저 확인 |
| 2. A 박스 이동 → `modified` (50행) | 통과 | `changingAnElementOfASavedDrawingMarksItModified`(`x`만 바꿈) |
| 3. 파일 삭제 → `missing`, 경로는 남음 | 통과 | `deletingTheSavedFileMarksTheDrawingMissing`. 빨강 먼저 확인 |
| 4. 같은 요소 재동기화 → 여전히 `saved` (D1) | 통과 | `aBrowserResyncWithoutChangesKeepsTheDrawingSaved`. 기록 칸 제외를 끄면 빨강임을 확인 |
| 5. `snapshot restore`로 A가 바뀜 → `modified` | 통과 | `aRestoreThatChangesASavedDrawingMarksItModified`. restore 전용 코드 없음 |
| 6. frame 밖 화살표 → `id: null, elements: 1, unsaved`, 전체 export 뒤 `saved` | 통과 | `looseElementsAreOneUnnamedEntrySavedByAWholeExport`. 빨강 먼저 확인 |
| 7. `snapshot save` → 이름·시각·`changedSince: false`, 고치면 `true`, 전에는 `null` | 통과 | `theLastSnapshotAndWhetherTheCanvasChangedSince`. 빨강 먼저 확인 |
| 8. `import f`(상대 경로) → 복사본 frame `saved`, `path` = 절대경로 | 통과 | `anImportedCopyIsSavedAtTheFileItCameFrom`. 빨강 먼저 확인 |
| 9. `--frame`·전체 export 파일, 스냅샷 파일에 `savedAt`·`state`·`changedSince` 없음 | 통과 | `saveStateStaysOutOfSavedFiles` |
| 11. MCP 텍스트 블록 = CLI와 같은 JSON, MCP export도 기록 | 통과 | `mcpScreenshotCarriesTheSameSaveState`. 빨강 먼저 확인 |
| 결정 1: 기록 실패(옛 서버 404) → export 성공·파일 있음·stderr 경고 1줄·`unsaved` | 통과 | `aFailedSaveRecordOnlyWarnsAndLeavesTheDrawingUnsaved`. `/api/save-state`만 404인 프록시. 빌드 산출물에서 `recordSave`가 다시 던지게 바꾸면 빨강임을 확인 |
| 결정 5: export가 읽은 뒤 기록 전에 바뀐 요소 → `modified`, 파일은 읽은 값 | 통과 | `anEditBetweenWritingAndRecordingLeavesTheDrawingModified`. 기록 요청 직전에 `a1`을 옮기는 프록시. 수정 전 빨강(`saved`) 확인 |
| 실브라우저에서 첫 동기화 뒤 거짓 `modified` 1회(D1 감수 사항) | **미시험** | 가짜 탭만 씀. 6d2·마무리 실세션 때 확인 |
| 기존 `npm test`, 타입 검사 둘 | 통과 | exit 0 |

바꾼 것: `src/server.ts`에 저장 기록(메모리 `Map`, frame id 키, frame 밖 묶음은 `null` 키)·`POST /api/save-state`(절대경로만, `frameIds` 없으면 캔버스 전체)·`GET /api/save-state`, `POST /api/snapshots`가 마지막 스냅샷 기록. 해시는 기록 칸 8개를 뺀 요소를 키 정렬·id 정렬해 sha256. `canvas-client.ts`에 `recordSave`·`getSaveState`. `buildSceneFile`이 `frameIds`를 돌려줌. CLI `export`·MCP `export_scene`은 파일을 쓴 뒤, `importScene`은 파일 경로가 있을 때 기록. CLI `screenshot` JSON과 MCP `get_canvas_screenshot` 세 번째 텍스트 블록에 `drawings`·`snapshot`. `mcp-tools.ts` 설명, `canvas-ops.md` 한 문장.

티켓에 없어 정한 것 → 아래 "6d1 확정 결정"에서 사용자가 판정했다.

## 6d1 확정 결정 (2026-10-10 그릴, 하나씩 물어 확정)

1. **기록 실패 → 경고만 남기고 명령은 성공.** `recordSave`·`getSaveState`가 실패해도(예: 이 기능 전부터 떠 있던 옛 서버 → 404) 파일·이미지는 이미 써졌으니 오류로 끝내지 않는다. 경고 한 줄(CLI는 stderr, MCP는 로그). 기록이 없으면 `unsaved`로 보여 묻는 쪽이라 안전하다. `screenshot`이 상태를 못 읽으면 CLI JSON에는 `drawings`·`snapshot`이 빠지고, MCP 세 번째 텍스트 블록은 `{"error":"Save state unavailable"}`. ADR-0010 Consequences에 1줄 추가했다. 기각: 오류로 끝내기(다시 export하면 동명 거부, 다시 import하면 복사본 하나 더).
2. **frame 자신의 이름·크기 변경도 `modified`.** 티켓 50행 "어떤 속성이든"과 같은 원칙. CONTEXT.md 용어 "저장 상태"에 반 줄 추가했다. 기각: 안의 요소만 비교.
3. **스냅샷 `savedAt` = 스냅샷 파일 mtime.** `snapshot list`의 `createdAt`과 항상 같은 값. 기각: 서버 시계를 따로 적기(파일을 밖에서 만지면 어긋남).
4. **저장 기록은 `src/core/save-state.ts` 모듈로, 상태(Map)까지 모듈 안에.** 서버는 `elements` Map만 넘긴다 — `snapshot-store.ts`의 `saveSnapshot(root, name, elements, force)`와 같은 꼴. 인터페이스는 함수 3개: `recordSave(elements, path, frameIds?)`(export·import 성공 때) · `recordSnapshot(elements, name, savedAt)`(snapshot save 성공 때) · `saveStateReport(elements)`(screenshot·6d2 `/health`가 읽음). `src/server.ts`에는 라우트 2개와 `POST /api/snapshots`의 호출 한 줄씩만 남는다(HTTP 일인 절대경로 검사·400은 서버). 응답 타입 `SaveState`·`DrawingSaveState`도 이 모듈이 갖고 `canvas-client.ts`는 타입만 가져온다. fs·시계 주입은 안 한다(어댑터 하나뿐). 테스트는 지금처럼 CLI·MCP 결과로만(D6). 근거: 6d2 `/health`가 같은 해시·그룹 계산을 쓰므로 한 곳에. 이 모듈을 지우면 해시·그룹·`missing` 판정이 screenshot·health 두 호출자에 다시 생긴다. ADR 아님(되돌리기 쉬움).

5. **"저장됨"의 기준은 파일에 들어간 내용이다(2026-10-10 그릴, 6d1 리뷰에서 발견).** 전에는 export가 요소를 읽고 파일을 쓴 **뒤** 서버가 그 순간 캔버스로 해시를 만들었다. 그 사이 브라우저에서 고친 것은 파일에 없는데 `saved`가 돼 묻지 않고 사라질 수 있었다. 이제 export는 읽은 요소를 `POST /api/save-state`에 함께 보내고 서버는 그것으로 해시를 만든다(해시 계산은 `save-state.ts` 한 곳 그대로). import는 그대로 — 복사본은 새 id·새 위치라 파일과 같지 않고, 서버가 frame을 늘릴 수 있어 막 놓인 복사본을 서버가 기록하는 것이 맞다. 기각: batch 응답을 고쳐 import도 클라이언트가 보내기(업스트림 수정, 남는 틈이 사실상 없음).

ADR·용어: 새 ADR 없음. 위 1·2·5의 문서 반영만(5는 ADR-0010 Consequences·CONTEXT.md "저장 상태").

## 핸드오프 — 6d1 결정 반영을 이어서 끝낸다 (2026-10-10)

### Goal

06을 끝낸다. 남은 순서: **6d1 결정 1·4 코드 반영 마무리(빨강 1개) → `npm test` → 사용자 확인 → 6d1 커밋 → 6d2 → 06 마무리**("슬라이스 6d 계획" 절). 사용자가 이어서 구현하라고 했다(2026-10-10). 되돌리지 않는다.

### First Action

`npm run build` 뒤 `node scripts/check-export.mjs aFailedSaveRecord`로 빨강을 재현하고, `src/core/sessions.ts` → `probeSession()`이 테스트의 프록시 세션을 왜 live로 안 보는지 찾는다. 판정은 그 함수 안의 세 조건(`response.ok`, `health.service === CANVAS_SERVICE_NAME`, `health.session === record.key`) 중 어느 것이 깨지는지 — 프록시가 `/health` 본문의 `session`만 바꾸므로 `service`가 빠졌거나 프록시의 응답 상태·헤더가 다를 가능성이 크다. `/tdd` 리듬(빨강 → 최소 수정 → 초록 → `npm test` 전체).

### Context

- 그릴로 6d1의 열린 결정 4개를 하나씩 물어 확정했다("6d1 확정 결정" 절). 결정 1(기록 실패 → 경고만)·4(`save-state.ts` 모듈)는 코드가 바뀌고, 2·3은 지금 코드 그대로다.
- 결정 1의 테스트는 "이 기능 전부터 떠 있던 옛 서버"를 흉내 낸다: 테스트 프로세스 안에 `/api/save-state`만 404로 답하고 나머지는 진짜 캔버스로 넘기는 HTTP 프록시를 띄우고, 가짜 세션 기록(`old…`)을 세션 폴더에 써서 CLI가 `--session old…`로 그리로 가게 한다. `/health` 본문의 `session`을 프록시 키로 바꿔 신원 검사를 통과시키려 했다.
- 테스트 방식을 바꿔도 된다 — 더 작은 수단이 있으면 그쪽으로. 단 판정은 CLI 결과(상태 0, 파일 존재, stderr 경고, `screenshot`에 `unsaved`)로 한다(D6 "행동만 검사").

### Current Progress (git, 2026-10-10, `repo_facts.sh`로 확인)

- 브랜치 `main`. push 안 함. 마지막 06 커밋 `27e5496`(6d1 착수 핸드오프). 그 위 `1322655`는 06과 무관.
- **6d1 전체 미커밋.** 수정 11개 + 새 파일 1개:
  - 6d1 본체(이전 핸드오프 기준, `npm test` 28케이스 통과했었다): `src/core/scene-io.ts`(`buildSceneFile`이 `frameIds`, `importScene`이 `recordSave`), `src/cli/commands/scene.ts`, `src/core/mcp-dispatch.ts`, `src/core/mcp-tools.ts`, `plugin/skills/archdraw/references/canvas-ops.md`, `scripts/check-export.mjs`(6d1 10케이스), 이 티켓.
  - 결정 4 반영(빌드 통과): **`src/core/save-state.ts` 새 파일** — `recordSave(elements, path, frameIds?)`·`recordSnapshot(elements, name, savedAt)`·`saveStateReport(elements)`, 타입 `SaveState`·`DrawingSaveState`·`DrawingState`, 상태 Map·해시·그룹·`stateOf`는 모듈 안. `src/server.ts` — HEAD 대비 +15줄뿐: `./core/save-state.js` import, `/api/save-state` 라우트 2개는 호출 한 줄, `POST /api/snapshots`가 `recordSnapshot(...)`. (6d1 본체가 서버 안에 뒀던 인라인 70줄은 커밋 전에 모듈로 옮겨져 diff에 안 보인다.)
  - 결정 1 반영(빌드 통과): `src/core/canvas-client.ts` — `recordSave`·`getSaveState`가 try/catch + `logger.warn`(stderr에 warn 이상이 찍힘), `getSaveState`는 실패 시 `null`, 타입은 `import type`. `src/cli/commands/scene.ts` `screenshot()` — `...(await getSaveState() ?? {})`. `src/core/mcp-dispatch.ts` `get_canvas_screenshot` — 세 번째 텍스트 블록 `await getSaveState() ?? { error: 'Save state unavailable' }`.
  - 결정 1 테스트: `scripts/check-export.mjs`에 `canvasWithoutSaveState()`·`aFailedSaveRecordOnlyWarnsAndLeavesTheDrawingUnsaved`(`cases` 맨 앞, 전체 29). **빨강** — `No live canvas session has the key "old…"`.
  - 문서: ADR-0010 Consequences 1줄(결정 1), `CONTEXT.md` "저장 상태" 반 줄(결정 2), 이 티켓("6d1 확정 결정" 절·Status·이 핸드오프).
- 마지막 검증: `npm run build` 통과. `npm test` 전체는 결정 반영 뒤 **아직 안 돌렸다**(빨강 케이스 때문에 실패할 것).

### Decisions Made

"6d1 확정 결정" 절(결정 4개·근거·기각안). ADR 새로 없음. 다시 묻지 않는다.

### What Worked

- 결정은 하나씩, 예시 먼저, 선택지 둘에 추천 하나. 넷 다 한 번에 답이 왔다.
- Q4를 "새 파일"에서 멈추지 않고 인터페이스(함수 3개, 상태는 모듈 안, 서버는 `elements`만 넘김)까지 정하니 6d2 `/health`의 재사용 경로가 바로 보였다.
- 서버 코드 이동은 `src/server.ts`의 블록을 통째로 잘라 모듈로 옮기고 라우트만 남기는 식으로 한 번에 됐다(빌드 한 번에 통과).

### What Didn't Work

- ⚠️ "이슈문서 빼고 고쳐"는 **문서(ADR·CONTEXT)만** 고치라는 뜻이었는데 코드 착수로 읽었다. 결정 뒤 코드를 만지기 전에는 "코드 시작한다"에 "예"를 받는다. 문서 수정 지시는 코드 승인이 아니다. (사용자가 나중에 이어서 구현하라고 해 결과적으로는 남겼다.)
- 프록시로 옛 서버를 흉내 내는 테스트는 세션 신원 검사(`probeSession`)와 얽혀 첫 시도에 안 돌았다. 원인은 못 찾았다.
- ⚠️ 되돌릴 일이 생겨도 `git checkout`은 쓰면 안 된다 — 같은 파일에 커밋 안 된 6d1 본체가 섞여 있다.

### Next Steps

1. First Action(빨강 해결) → `npm run build` → `npm test` 전체(export 29) → `type-check`·`type-check:frontend` → 체크박스·"슬라이스 6d1 결과" 표에 결정 1 케이스 행 추가 → 사용자 확인 → 6d1 커밋(영어 1~2문장, 트레일러 없음).
2. 6d2(사용자 승인 뒤): D6-10 테스트 → `/health`가 `saveStateReport(elements)`의 `drawings`를 세어 미저장(`missing` 포함)·수정됨 수 → `session list`·`session_list` → `SKILL.md`("unsaved or modified" → "not saved", 그림 지우기 전 1회 묻기, 붙지 않은 세션은 `session list` 수로 묻기)·`references/saving.md` → 체크박스 56·57.
3. 06 마무리: 실브라우저로 D1 거짓 `modified` 1회 확인(6d1 결과 표의 미시험) → 체크박스 58·78 → Status → `spec.md` 진행 표의 06 줄 갱신.
