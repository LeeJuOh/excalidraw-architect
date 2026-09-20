# 스냅샷은 프로젝트별 디스크 폴더, 캔버스는 세션별. 같은 이름은 거부하고 `--force`로만 덮어쓴다

업스트림 스냅샷은 메모리 Map이라 서버가 죽으면 사라지고, export는 `EXCALIDRAW_EXPORT_DIR` 한 폴더 밖 쓰기를 거부한다. 스토리 17(어제 저장한 도면을 오늘 복사해 변경안 색칠)이 세션을 넘겨야 하므로 스냅샷을 데이터 폴더 `snapshots/<프로젝트 루트 경로 해시>/`에 두고 TTL 없이 보관한다. 캔버스는 세션별([ADR-0003](0003-one-canvas-server-per-session.md))이지만 스냅샷은 프로젝트별이라 같은 프로젝트의 세션들과 다음 날 새 세션이 같은 폴더를 본다. `snapshot save`·`export` 모두 같은 이름이 있으면 기본 거부하고 있음·만든 시각을 출력하며 `--force`로만 덮어쓴다 — "캔버스 안 지움"([ADR-0007](0007-canvas-never-cleared-import-copies.md))을 파일에도 적용한 것이다. export 산출물 경로는 고정하지 않고 CLI·MCP 모두 지정 경로를 받는다(2026-09-16). 업스트림의 export 폴더 제한은 폐기한다.

## Considered Options

- 세션별 스냅샷 폴더: 세션 키가 사라져 다음 날 못 찾아 스토리 17을 위반해 기각했다.
- 조용한 덮어쓰기 또는 자동 접미사: 어제 도면이 소리 없이 바뀌거나 이름이 불어나 기각했다.
- 산출물을 `docs/architecture/`나 데이터 폴더로 제한: 프로젝트마다 문서 배치가 달라 사용자 결정으로 폐기했다.

## Consequences

- 데이터 폴더는 `$CLAUDE_PLUGIN_DATA` → `$PLUGIN_DATA` → `~/.excalidraw-architect/` 순이다. 스크린샷 임시 png도 그 아래 `tmp/`에 둔다.
- 이름 없는 스냅샷은 `YYYY-MM-DD_HHmmssZ_<영어 이름>`이며 이름은 에이전트가 정한다. 같은 초·같은 이름은 동명 거부 규칙을 따른다.
