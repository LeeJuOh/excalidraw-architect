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
- **미포함 참조 (2026-09-19 2차 검수 A5):** `--frame`으로 일부만 export하면 파일 밖 대상을 가리키는 참조는 "미포함"으로 남긴다. import 뒤 그 참조는 어떤 기존 그림에도 붙지 않는다 — 이름이 같은 그림이 있어도 연결하지 않는다. 참조는 frame 이름이 아니라 ID 기반이다. 박스 요소의 `link` 칸에 Excalidraw 요소 링크 `?element=<대상 frame id>`를 적는다(2026-09-20 그릴, ADR-0008). `link` 칸을 툴에서 받는 것은 05 담당. import가 ID를 새로 발급할 때 `link`의 frame id도 같은 세트의 새 id로 바꾸고, 세트 밖 id는 미포함으로 둔다. 대상을 자동으로 함께 저장해 사용자 지정 범위를 넓히지 않는다. 미포함 참조를 따라갈 때의 안내·새로 그리기는 03 담당.
- **저장 상태 기록·동봉 (PRD §3.5 "저장 상태 표시", 2026-09-19):** `export`(전체·`--frame`)·`import`·`snapshot save`가 성공하면 세션 상태에 그림(frame)별 마지막 저장 경로·시각을, 스냅샷은 캔버스 단위 마지막 이름·시각을 적는다. 경로는 명령 인자로 받은 값을 그대로 적고 디스크를 찾지 않는다. `screenshot` 결과에 그림별 상태를 동봉한다: 저장 경로와 시각, 저장 이후 그 그림 요소가 바뀌었는지(저장 후 수정됨), 기록된 경로의 파일이 지금 없는지(파일 없음), 기록이 없으면 미저장. 스냅샷은 마지막 이름과 그 후 캔버스 변경 여부. 기록은 세션 메모리에만 두고 스냅샷·export 파일에는 넣지 않는다. 03은 이 값을 옮겨 적기만 한다.
- 미확인 필수요소는 저장을 거부하는 조건이 아니다. "확인 못 함" 표시와 점선을 저장·재로드 후에도 보존한다. 미확인 항목 안내는 03 담당이다.
- **저장 범위·파일 단위 (검수 R07 일부):** PRD §3.5를 따른다. 기본 전체 export는 여러 그림과 현재 배치를 파일 하나에 보존하며, 특정 그림 요청에는 `--frame`을 사용한다. 발화 해석은 03 담당.
- **그림 단위 저장·복사 (검수 R02, 2026-09-14 그릴 확정):** 캔버스에 그림 A·B가 같이 있을 때 A만 저장하고, 저장된 A를 B 옆에 한 장 더 놓을 수 있어야 한다(스토리 17). 규칙 넷:
  1. `export`는 기본 캔버스 전체, `--frame <이름>`이면 그 frame과 `frameId`가 일치하는 자식만 담는다. frame 밖 요소는 빠진다. (frame은 05) 박스에 묶인 라벨 텍스트(`containerId` 있음)는 05가 프론트 동기화 때 컨테이너의 `frameId`를 채우므로 이 규칙만으로 따라온다(2026-10-06 그릴 05 Q6 (b)). 그래도 `containerId`가 있는데 `frameId`가 `null`인 텍스트가 오면 컨테이너를 따른다 — 05 이전에 저장된 데이터 대비.
  2. `import`는 캔버스를 지우지 않고 얹는다. 요소·frame·화살표 바인딩(`startBinding`/`endBinding`/`containerId`/`frameId`) ID를 한 세트로 **항상** 새로 발급한다 — 원본이 캔버스에 있어도 덮어쓰지 않고 독립된 복사본이 된다. `--replace` 옵션은 없앤다.
  3. 캔버스를 지우는 명령은 `snapshot restore` 하나뿐(지우고 전체 복원). "되돌리기는 지운다, 불러오기는 얹는다".
  4. 불러온 그림은 현재 요소 전체 범위의 오른쪽에 간격을 두고 놓는다(그림 안 상대 위치 유지). frame 이름은 `"<원본 이름> (복사)"`. 파일에 frame이 없으면 파일명으로 frame 하나를 씌운다.

**Blocked by:** 01 (플러그인 골격), 04 (캔버스 세션의 프로젝트 루트 — 스냅샷 폴더를 나누는 기준), 05 (frame — `export --frame`·import의 frame 씌우기가 frame 요소를 전제)

**Status:** ready-for-agent (2026-10-09 — 슬라이스 6a·6b 완료, 6c·6d 남음. 나눈 기준과 결과는 아래 "슬라이스 6a 결과"·"슬라이스 6b 결과")

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
- [ ] `--frame A`로 뺀 파일에서 A 밖 요소에 붙은 화살표 바인딩은 끊겨 있고, 파일이 excalidraw.com에서 열린다. `link`의 미포함 참조는 그대로 남는다
- [ ] 그 파일을 `import`하면 B와 원본 A가 그대로 남고, 새 ID를 가진 `A (복사)`가 A·B 오른쪽에 생기며, 복사본 화살표는 복사본 박스에 붙어 있다
- [ ] 복사본의 박스 색을 바꿔도 원본 A는 그대로다
- [ ] `import --replace`는 사용법 오류로 거부되고, `snapshot restore`만 캔버스를 비운다
- [ ] frame 없는 `.excalidraw` 파일을 `import`하면 파일명 frame 안에 들어온다
- [ ] frame A·B에서 `export --frame A --out <임의 경로>` 뒤 `screenshot` 결과에 A는 그 경로·시각, B는 미저장으로 나온다. A의 요소를 하나 고친 뒤에는 A가 저장 후 수정됨으로 바뀐다. 파일을 밖에서 지우면 파일 없음으로 바뀐다
- [ ] `snapshot save` 뒤 `screenshot` 결과에 마지막 스냅샷 이름이 있고, 요소를 고치면 그 후 변경 여부가 참이 된다
- [ ] `import <파일>`로 들어온 복사본 frame의 저장 경로가 그 파일로 기록된다
- [ ] 저장 상태 기록은 export·snapshot 파일 내용에 들어가지 않는다
- [ ] `session list`·`session_list`의 결과에 캔버스 세션마다 미저장 그림과 저장 후 수정된 그림의 수가 있다. 붙지 않은 캔버스 세션을 키로 끝내기 전에 에이전트가 이 수를 보고 1회 묻는다(2026-10-05, 04 Q6 · ADR-0010)
- [ ] 사용자가 그림을 지우라고 했을 때 그 그림이 미저장이거나 저장 후 수정됨이면 에이전트가 지우기 전에 1회 묻고, 저장된 그림은 묻지 않고 지운다. `SKILL.md`에 이 규칙이 있다. 서버는 묻지 않고 frame과 자식을 같이 지운다(05) (2026-10-05 05 검수 · ADR-0010)
- [ ] 기존 `npm test` 통과

- [ ] frame A·B·C가 있는 캔버스를 기본 export하면 파일 하나에 세 그림과 배치가 모두 남는다. 새 빈 캔버스로 import하면 그림 사이 상대 배치가 유지된다

- [ ] A가 B를 내부 그림으로 참조하는 캔버스를 export하고 새 캔버스에 import하면 참조가 새 B를 가리킨다. 두 상위 그림이 B를 함께 참조하는 경우에도 대상은 같은 B 하나다
- [ ] 원본 A·B가 있는 캔버스에 같은 파일을 import해도 복사본 A의 참조는 복사본 B를 가리키며 원본 B를 가리키지 않는다
- [ ] A가 B를 참조하는 캔버스에서 `export --frame A`한 파일을, 이름이 B인 다른 그림이 있는 새 캔버스에 import하면 복사본 A의 참조는 미포함 상태이고 그 B에 붙지 않는다(2차 검수 A5)
- [x] snapshot save 후 서버를 재시작해 restore하면 그림 사이 참조가 유지된다. 스냅샷에는 시간 경과에 따른 자동 만료가 없다
- [x] 03이 정한 `YYYY-MM-DD_HHmmssZ_<영어 이름>` 스냅샷이 UTC 생성 시각과 일치하는 이름으로 저장되고, 직접 지정한 이름은 그대로 저장된다. 성공 결과에는 실제 이름·전체 경로가 있고 같은 초·이름의 충돌은 거부된다
- [ ] "확인 못 함" 필수요소가 있는 그림의 export·import 및 snapshot save·restore가 성공하며 점선과 해당 표시가 유지된다


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

티켓에 없어 정한 것(되돌리기 쉬움):
- `--frame` 파일의 이미지 `files`는 그 frame 요소가 쓰는 것만 남긴다.
- 박스가 파일 밖인 텍스트의 `containerId`는 `null`로 끊는다(바인딩과 같은 이유).
- `--frame` 값이 어떤 frame의 id와 같으면 이름보다 id를 먼저 고른다.

알려진 한계:
- 동명 거부로 끝나도 새로 만든 상위 폴더는 남는다.
- frame 사이를 잇는 화살표(`frameId` 없음)는 어느 `--frame` 파일에도 들어가지 않는다. 티켓 규칙 1 그대로다.

보안 트레이드오프(결정대로 둠): MCP 툴이 프로세스 권한 안에서 어느 경로든 읽고 쓴다. 2026-09-16 사용자 결정·Q5. 덮어쓰기는 `force`일 때만이고, 실행 권한은 호스트가 정한다.


## 핸드오프 — 6b 구현 끝, 커밋 전 (2026-10-09)

### Goal

06을 슬라이스 4개로 끝낸다: 6a 스냅샷 디스크화(`5f83f74`) → 6b export(구현 끝, 미커밋) → 6c import → 6d 저장 상태. 슬라이스 하나씩 한다. 커밋과 다음 슬라이스 착수는 사용자 승인 뒤에 한다. 티켓에 없는 결정이 필요하면 멈추고 묻는다.

### First Action

**사용자에게 6b 판단 3개와 커밋을 한 번에 확인받는다.** 지난 세션 끝에 물었지만 답이 아직 없다:
1. `--frame` 값이 frame id와 이름에 모두 맞으면 id 우선 — 추천: 그대로.
2. `--frame` 파일의 이미지 `files`는 그 frame이 쓰는 것만 — 추천: 그대로.
3. "excalidraw.com에서 열림" 미시험 — 추천: 6c 끝 실세션 스크린샷 때 같이 확인.

승인되면 커밋한다(메시지 안: `Export to any path the user names (issue 06 slice 6b): resolve MCP paths from the project root, make missing folders, refuse an existing file unless forced, and export one frame with --frame.`). 그다음 6c 시작 보고를 하고 `/tdd`로 들어간다.

### Context

- 6b는 "슬라이스 6b 결과" 표대로다. 미시험은 excalidraw.com 열림과 실제 브라우저 이미지 렌더링 둘.
- 리뷰 서브에이전트 둘(규칙·스펙)의 지적을 반영했다. 남긴 판단 사항: `writeOutputFile`(`scene-io.ts`)과 `saveSnapshot`(`snapshot-store.ts`)의 `wx`·`EEXIST` 구조가 비슷하다. 메시지가 달라 합치지 않았다.
- 6c 범위는 티켓 "그림 단위 저장·복사" 규칙 2·4, 그림 참조·미포함 참조 단락, 관련 체크박스다. 결정은 ADR-0007·0008.

### Current Progress (git 기준)

- 브랜치 `main`. 마지막 커밋 `edc2969`(이슈 11 완료 표시).
- 미커밋 6b 변경: `src/core/scene-io.ts`(`writeOutputFile`, `OutputFileExistsError`, `findFrame`, `onlyFrame`, `buildSceneFile({ frame })`), `src/core/mcp-session.ts`(`resolveFromProjectRoot`), `src/core/mcp-dispatch.ts`, `src/core/mcp-tools.ts`, `src/cli/commands/scene.ts`, `src/cli/run.ts`(사용법), `src/core/normalize.ts`·`src/core/config.ts`(`sanitizeFilePath`·`ALLOWED_EXPORT_DIR` 삭제), `package.json`(`test:export`), `plugin/skills/archdraw/references/canvas-ops.md`, `AGENTS.md`(지울 목록), 이 티켓, 새 `scripts/check-export.mjs`.
- 마지막 확인(미커밋 상태): `npm test` exit 0(`export: all 11 cases passed` 포함), `npx tsc --noEmit`·`npm run type-check:frontend` 통과.
- 6c·6d: 미착수.

### Decisions Made

- 6b의 결정과 근거는 "슬라이스 6b 결과"의 "바꾼 것"·"티켓에 없어 정한 것". 판단 3개는 위 First Action처럼 사용자 확인 대기.
- 6b 착수 전 확인한 사실: export는 요소 id를 바꾸지 않는다(seed만 결정적). 라벨이 없던 박스의 라벨은 export에서 `<박스 id>-label` id로 생긴다(`expandElementsForExport`, `src/core/expand-elements.ts`). 6c import는 이 id들도 한 세트로 새로 발급해야 한다.

### What Worked

- 테스트 방식: 실제 `dist`, 샌드박스 HOME, `session start --project`로 띄운 서버, `POST /api/elements/sync`로 브라우저 동기화 흉내. 이미지는 같은 프로세스의 WebSocket 가짜 탭(`openFakeTab`, `check-export.mjs`)이 `/api/export/image/result`로 답한다. 6c·6d에도 쓴다.
- 리뷰 서브에이전트 둘이 실제 구멍을 잡았다. 이번에는 frame 소속 규칙의 중복(`frameMembers`, `src/core/frames.ts`를 쓰도록 고침)과 테스트 빈칸.
- 끝 보고는 **문제 있었나 / 판단할 것(선택지+추천) / 커밋해도 되나** 셋만. 사용자가 이 형식으로 다시 물었다.

### What Didn't Work

- ⚠️ 가짜 탭이 있는 테스트에서 `spawnSync`로 CLI를 부르면 이벤트 루프가 막혀 탭이 답을 못 한다(30초 타임아웃). 그런 호출은 `cliAsync`(비동기 spawn)를 쓴다.
- ⚠️ 테스트에서 존재하지 않는 폴더를 cwd로 주면 spawn이 status `null`로 실패한다. 셋업에서 폴더를 먼저 만든다.
- ⚠️ 마크다운 표 칸 안의 `|`(예: `<name|id>`)는 표를 깬다.
- 질문은 한 번에 하나, 짧게(6a 세션의 교훈, 여전히 유효).

### Next Steps

1. 6c import. `importScene`(`src/core/scene-io.ts`), MCP `import_scene`의 `mode: replace|merge`(`mcp-dispatch.ts`·`mcp-tools.ts`), CLI `importCmd`의 `--replace`(`scene.ts`)를 없앤다. 새 ID 한 세트(요소·frame·`containerId`·`frameId`·`startBinding`/`endBinding`·`boundElements`·`groupIds`), `link`의 `?element=<frame id>` 재매핑, 세트 밖 id는 미포함으로 둠, 현재 요소 전체 범위 오른쪽에 배치, `"<원본 이름> (복사)"`, frame 없는 파일은 파일명 frame. 배치 간격은 티켓에 수치가 없다 — 정하기 전에 묻거나 `FRAME_MARGIN`(`frames.ts`)을 쓰는 안을 추천으로 제시. 6c 끝에 실세션 스크린샷과 excalidraw.com 열림 확인(판단 3 승인 시).
2. 6d 저장 상태. `screenshot` 결과에 그림별 상태, `session list`·`session_list`에 수, `SKILL.md` 규칙.
3. 마지막에 공통 체크박스(`npm test`, R10 기록)를 체크하고 Status를 바꾼다. `spec.md` "구현 이슈와 진행 순서" 표의 06 줄도 바꾼다(지금은 "6a 완료, 6b·6c·6d 남음").

