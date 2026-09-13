# 06: 스냅샷·export 영속화 — 데이터 폴더와 `docs/architecture/`

> 02 도그푸딩(구현 뒤)의 판정이 수정 사항으로 돌아온다.

**What to build:** 사용자가 "지금 상태 찍어둬"라고 하면 스냅샷이 디스크에 남아 서버를 재시작하거나 다음 날 다시 열어도 `restore`된다. 도면으로 승격한 그림을 "저장해"라고 하면 레포의 `docs/architecture/`에 `.excalidraw`로 export된다. 스토리 17(저장된 도면 복사 → 그 위에 변경 색칠 → before/after 비교)이 세션을 넘겨 동작한다.

- 현재 스냅샷은 메모리 Map이라 서버가 죽으면 사라진다. 저장소를 데이터 폴더 `snapshots/<name>.excalidraw`로 바꾼다.
- export 쓰기 허용 폴더를 업스트림의 환경변수 한 폴더(기본 cwd)에서 **레포 `docs/architecture/` + 데이터 폴더** 두 곳으로 바꾼다. 그 밖은 거부. CLI `export --out`은 지금 경로 검사 없이 바로 쓰므로, 검사를 CLI·MCP 공통으로 건다.
- 데이터 폴더 우선순위는 01과 같다(`$CLAUDE_PLUGIN_DATA` → `$PLUGIN_DATA` → 홈 아래).
- 파일명 규칙(줌 경로가 파일명)은 03 스킬이 정한다. 이 티켓은 "그 이름으로 저장할 수 있다"까지.

**Blocked by:** 01 (플러그인 골격)

**Status:** ready-for-agent

- [ ] `snapshot save x` → 서버 `stop` → `start` → `snapshot restore x`로 그림이 돌아온다
- [ ] `snapshot list`가 디스크의 스냅샷을 보여준다
- [ ] `export --out docs/architecture/foo.excalidraw`가 레포 안에 파일을 만들고, `--out ../outside.excalidraw`는 CLI·MCP 둘 다 거부된다
- [ ] 데이터 폴더가 없으면 첫 사용 때 만들어진다
- [ ] 기존 `npm test` 통과
