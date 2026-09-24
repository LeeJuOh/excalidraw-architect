# 데이터 폴더는 항상 `~/.excalidraw-architect/`이고 호스트 변수는 읽지 않는다

데이터 폴더(스냅샷 `snapshots/`)를 처음엔 `$CLAUDE_PLUGIN_DATA` → `$PLUGIN_DATA` → `~/.excalidraw-architect/` 순으로 잡았다. 두 가지가 깨졌다. 첫째, Claude Code는 다른 플러그인 훅이 `CLAUDE_ENV_FILE`로 넣은 `CLAUDE_PLUGIN_DATA`를 세션의 모든 Bash에 물려준다(2026-09-24 이 레포 세션 실측값 `~/.claude/plugins/data/codex-openai-codex`). 그래서 CLI 폴백의 png가 남의 플러그인 폴더로 갔다. 둘째, 값이 맞아도 Claude MCP·Codex MCP·CLI 폴백이 서로 다른 폴더를 본다. 그러면 어제 한 호스트에서 저장한 스냅샷을 오늘 다른 호스트나 채널에서 찾지 못한다([ADR-0009](0009-snapshots-per-project-canvas-per-session.md)의 스토리 17 위반). 그래서 호스트 변수를 읽지 않고, 호스트·채널과 무관하게 홈 아래 한 폴더를 쓴다.

## Considered Options

- 우리 `.mcp.json`이 `ARCHDRAW_DATA_DIR`로 호스트 폴더를 넘김: 남의 값이 새어 드는 것은 막는다. 하지만 MCP는 호스트 폴더, CLI 폴백은 홈이라 같은 호스트 안에서도 폴더가 갈린다.
- 경로에 `excalidraw-architect`가 들어 있을 때만 호스트 값을 믿음: Claude의 폴더 이름 규칙에 기대야 하고, 호스트 간 분리가 그대로 남는다.
- 스크린샷 png도 데이터 폴더 `tmp/`에 둠: 한 번 보고 버리는 파일인데 그 폴더에는 지우는 코드가 없어 쌓이기만 한다. 업스트림 기본값인 OS 임시 폴더도 이미 레포 밖이고 OS가 치운다.

## Consequences

- 플러그인을 제거해도 폴더가 남는다. Claude의 uninstall 자동 정리를 포기한 대가다.
