# 06: 스냅샷·export 영속화 — 데이터 폴더와 `docs/architecture/`

> 02 도그푸딩(구현 뒤)의 판정이 수정 사항으로 돌아온다.

**What to build:** 사용자가 "지금 상태 찍어둬"라고 하면 스냅샷이 디스크에 남아 서버를 재시작하거나 다음 날 다시 열어도 `restore`된다. 도면으로 승격한 그림을 "저장해"라고 하면 레포의 `docs/architecture/`에 `.excalidraw`로 export된다. 스토리 17(저장된 도면 복사 → 그 위에 변경 색칠 → before/after 비교)이 세션을 넘겨 동작한다.

- 현재 스냅샷은 메모리 Map이라 서버가 죽으면 사라진다. 저장소를 데이터 폴더 `snapshots/<프로젝트 식별자>/<name>.excalidraw`로 바꾼다.
- **저장소 범위·동명 정책 (검수 R03, 2026-09-14 그릴 확정):** 프로젝트 식별자는 세션의 프로젝트 루트(04) 경로 해시. 같은 프로젝트의 세션들과 다음 날 새 세션이 같은 폴더를 본다 — 캔버스는 세션별, 스냅샷은 프로젝트별. `snapshot list`는 내 프로젝트 것만 보인다. 같은 이름이 이미 있으면 `snapshot save`·`export` 모두 기본 거부하고 있음·만든 시각을 출력한다. `--force`로만 덮어쓴다.
- export 쓰기 허용 폴더를 업스트림의 환경변수 한 폴더(기본 cwd)에서 **레포 `docs/architecture/` + 데이터 폴더** 두 곳으로 바꾼다. 그 밖은 거부. CLI `export --out`은 지금 경로 검사 없이 바로 쓰므로, 검사를 CLI·MCP 공통으로 건다.
- 데이터 폴더 우선순위는 01과 같다(`$CLAUDE_PLUGIN_DATA` → `$PLUGIN_DATA` → 홈 아래).
- 파일명 규칙은 R07 잔여 쟁점이며, 캔버스 전체를 파일 하나로 저장하는 결정에 맞춰 03과 책임을 확정한다. 기존 "줌 경로가 파일명"은 확정 규칙으로 사용하지 않는다.
- **저장 범위·파일 단위 (검수 R07 일부):** PRD §3.5를 따른다. 기본 전체 export는 여러 그림과 현재 배치를 파일 하나에 보존하며, 특정 그림 요청에는 `--frame`을 사용한다. 발화 해석은 03 담당.
- **그림 단위 저장·복사 (검수 R02, 2026-09-14 그릴 확정):** 캔버스에 그림 A·B가 같이 있을 때 A만 저장하고, 저장된 A를 B 옆에 한 장 더 놓을 수 있어야 한다(스토리 17). 규칙 넷:
  1. `export`는 기본 캔버스 전체, `--frame <이름>`이면 그 frame과 `frameId`가 일치하는 자식만 담는다. frame 밖 요소는 빠진다. (frame은 05)
  2. `import`는 캔버스를 지우지 않고 얹는다. 요소·frame·화살표 바인딩(`startBinding`/`endBinding`/`containerId`/`frameId`) ID를 한 세트로 **항상** 새로 발급한다 — 원본이 캔버스에 있어도 덮어쓰지 않고 독립된 복사본이 된다. `--replace` 옵션은 없앤다.
  3. 캔버스를 지우는 명령은 `snapshot restore` 하나뿐(지우고 전체 복원). "되돌리기는 지운다, 불러오기는 얹는다".
  4. 불러온 그림은 현재 요소 전체 범위의 오른쪽에 간격을 두고 놓는다(그림 안 상대 위치 유지). frame 이름은 `"<원본 이름> (복사)"`. 파일에 frame이 없으면 파일명으로 frame 하나를 씌운다.

**Blocked by:** 01 (플러그인 골격), 05 (frame — `export --frame`·import의 frame 씌우기가 frame 요소를 전제)

**Status:** ready-for-agent

- [ ] `snapshot save x` → 서버 `stop` → `start` → `snapshot restore x`로 그림이 돌아온다
- [ ] `snapshot list`가 디스크의 스냅샷을 보여준다
- [ ] `export --out docs/architecture/foo.excalidraw`가 레포 안에 파일을 만들고, `--out ../outside.excalidraw`는 CLI·MCP 둘 다 거부된다
- [ ] 데이터 폴더가 없으면 첫 사용 때 만들어진다
- [ ] 레포 둘에서 각각 `snapshot save x`하면 서로 다른 폴더에 생기고, 각자의 `snapshot list`엔 자기 것만 보인다
- [ ] 같은 레포에서 세션 둘을 열면 한쪽이 찍은 스냅샷이 다른 쪽 `snapshot list`에 보이고 restore된다
- [ ] 같은 이름으로 `snapshot save`·`export`하면 거부되며 메시지에 만든 시각이 있고, `--force`면 덮어쓴다
- [ ] frame A·B가 있는 캔버스에서 `export --frame A`가 A의 요소만 담은 파일을 만들고, B는 파일에 없다
- [ ] 그 파일을 `import`하면 B와 원본 A가 그대로 남고, 새 ID를 가진 `A (복사)`가 A·B 오른쪽에 생기며, 복사본 화살표는 복사본 박스에 붙어 있다
- [ ] 복사본의 박스 색을 바꿔도 원본 A는 그대로다
- [ ] `import --replace`는 사용법 오류로 거부되고, `snapshot restore`만 캔버스를 비운다
- [ ] frame 없는 `.excalidraw` 파일을 `import`하면 파일명 frame 안에 들어온다
- [ ] 기존 `npm test` 통과

- [ ] frame A·B·C가 있는 캔버스를 기본 export하면 파일 하나에 세 그림과 배치가 모두 남는다. 새 빈 캔버스로 import하면 그림 사이 상대 배치가 유지된다
